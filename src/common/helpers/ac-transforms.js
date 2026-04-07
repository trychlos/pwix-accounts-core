/*
 * pwix:accounts-core/src/common/helpers/ac-transforms.js
 *
 * These are transformation functions which are only called-from and executed server-side.
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

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

    // known fields which are not set are 'undefined' so that they provide the client a reactivity way
    // only considering first-level fields
    // see https://docs.meteor.com/api/meteor#Subscription-changed
    async addUndefined( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        check( itemDoc, Object );
        check( options, Object );
        for( const name of instance.fieldSet().names()){
            if( name.indexOf( '.' ) === -1 && !Object.keys( itemDoc ).includes( name )){
                itemDoc[name] = undefined;
            }
        }
        return itemDoc;
    },

    // make sure the password, even crypted, is not returned:
    // {
    //     _id: '55QDvyxocA8XBnyTy',
    //     createdAt: 2023-02-08T21:16:56.851Z,
    //     services: 
    //        password: {
    //           bcrypt: '$2b$10$WKT2CuGR5mqbuep.GxKfxegr13RWikyNJ9ARK0HbS5oVLJLAVX5v6',
    //           reset: {
    //              token: 'GT8sSr_v8Zr2RbUUO77mK3ZH_nyAOA9DA2XaT5fv3dj',
    //              email: 'mmmm@mmm.mm',
    //              when: ISODate('2026-04-03T15:50:05.713Z'),
    //              reason: 'reset'
    //           }
    //        },
    //        resume: { loginTokens: [] },
    //        email: { verificationTokens: [] }
    //     }n,
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
    _keepFields: [
        'services\.password\.reset'       // needed by AccountsUI to check and reset the password
    ],
    async cleanupUserDocument( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        if( itemDoc ){
            const removeRegexes = instance.opts().cleanRegexes() || [];
            const keepRegexes = acTransforms._keepFields || [];

            // compile got regexes
            const _compile = function( regexes ){
                return regexes.map(( it ) => new RegExp( it ));
            };
            const removeMatchers = _compile( removeRegexes );
            const keepMatchers = _compile( keepRegexes );

            const _matchesOneOf = function( string, matchers ){
                for( const re of matchers ){
                    if( re.test( string )){
                        return true;
                    }
                }
                return false;
            };

            const _matchToRemove = function( path ){
                return _matchesOneOf( path, removeMatchers );
            };

            const _matchToKeep = function( path ){
                return _matchesOneOf( path, keepMatchers );
            };

            // true if one keep regex could concern this path or something below it
            // needed because "services.password" must not be removed as a block if
            // "services.password.reset" is to be preserved
            const _mayContainKeepBelow = function( path ){
                const dotted = path + '.';
                for( const regex of keepRegexes ){
                    if( regex.startsWith( dotted )){
                        return true;
                    }
                }
                return false;
            };

            const _isTraversable = function( value ){
                return _.isObject( value ) && value !== null;
            };

            const _cleanup = function( node, basePath='' ){
                if( !_isTraversable( node )){
                    return;
                }

                for( const key of Object.keys( node )){
                    const path = basePath ? `${basePath}.${key}` : key;
                    const value = node[key];

                    const mustRemove = _matchToRemove( path );
                    const mustKeep = _matchToKeep( path );
                    const mayContainKeep = _mayContainKeepBelow( path );

                    if( mustRemove && !mustKeep ){
                        if( _isTraversable( value ) && mayContainKeep ){
                            // cannot remove whole subtree yet; inspect children
                            _cleanup( value, path );

                            // optional: if object became empty after cleanup, remove it
                            if( _.isObject( value ) && Object.keys( value ).length === 0 ){
                                //if( itemDoc._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'deleting one', key );
                                delete node[key];
                            }
                        } else {
                            //if( itemDoc._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'deleting two', key );
                            delete node[key];
                        }
                    } else if( _isTraversable( value )){
                        _cleanup( value, path );

                        // optional cleanup of emptied objects
                        if( _.isObject( value ) && !Array.isArray( value ) && !_.isDate( value ) && Object.keys( value ).length === 0 ){
                            //if( itemDoc._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'deleting three', key );
                            delete node[key];
                        }
                    }
                }
            };

            _cleanup( itemDoc );
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
