/*
 * pwix:accounts-core/src/common/helpers/ac-transforms.js
 *
 * These are transformation functions which are only called-from and executed server-side.
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';

export const acTransforms = {

    // add a DYN sub-object to documents sent to the client
    async addDyn( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        check( itemDoc, Object );
        check( options, Object );
        itemDoc.DYN = itemDoc.DYN || {};
        return itemDoc;
    },

    // compute the preferred label
    async addPreferredLabel( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        check( itemDoc, Object );
        check( options, Object );
        itemDoc.DYN.preferredLabel = await instance.preferredLabel( itemDoc );
        return itemDoc;
    },

    // make sure the password, even crypted, is not returned:
    // {
    //     _id: '55QDvyxocA8XBnyTy',
    //     createdAt: 2023-02-08T21:16:56.851Z,
    //     services: { password: {}, email: { verificationTokens: [Array] } },
    //     username: 'cccc',
    //     emails: [ { address: 'cccc@ccc.cc', verified: true } ],
    //     isAllowed: true,
    //     createdBy: 'EqvmJAhNAZTBAECya',
    //     lastConnection: 2023-02-09T13:22:14.057Z,
    //     updatedAt: 2023-02-09T13:25:16.114Z,
    //     updatedBy: 'EqvmJAhNAZTBAECya'
    // }
    // 
    // Note: do NOT expose this function in client-side world. This would be a security risk as a malicious user could just override it.
    ///
    /*
    Replaced by cleanRegexes instanciation argument as of v2.0
    sensitiveFields: [
        'services.resume',
        'services.password',
        'profile'
    ],
    */
    async cleanupUserDocument( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        if( itemDoc ){
            // whether the string matches one of the regexes
            const regexes = instance.opts().cleanRegexes() || [];
            const _match = function( string ){
                for( const regex of regexes ){
                    if( string.match( regex )){
                        return true;
                    }
                }
                return false;
            };
            // scan all keys for regexes matches
            const _scan = function( it ){
                let to_remove = [];
                for( const key of Object.keys( it )){
                    if( _match( key )){
                        to_remove.push( key );
                    } else {
                        if( _.isObject( it[key] )){
                            _scan( it[key] );
                        }
                    }
                }
                for( const key of to_remove ){
                    delete it[key];
                }
            };
            _scan( itemDoc );
        }
        return itemDoc;
    },

    // remove the DYN sub-object so that it doesn't go to the database
    async removeDyn( instance, itemDoc, options={} ){
        const clone = _.cloneDeep( itemDoc );
        delete clone.DYN;
        return clone;
    }
};
