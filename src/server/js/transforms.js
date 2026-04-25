/*
 * pwix:accounts-core/src/server/js/transforms.js
 *
 * These are transformation functions which are only called-from and executed server-side.
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

AccountsCore.Transforms = {

    // add a DYN sub-object to documents sent to the client
    async addDyn( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        check( itemDoc, Object );
        check( options, Object );
        itemDoc.DYN = itemDoc.DYN || {};
        return itemDoc;
    },

    // add to DYN a 'services' array which contains the initial keys
    //  hoping that at least of them is an authentication service
    async addAuthServices( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        check( itemDoc, Object );
        check( options, Object );
        itemDoc.DYN.services = itemDoc.DYN.services || [];
        for( const key of Object.keys( itemDoc.services || {} )){
            itemDoc.DYN.services.push( key );
        }
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

    // make sure that each defined field appears in the returned item, as least as 'undefined' when unset
    // Rationale: when a publication send a record where not all fields are set, the unset fields are just not part of the sent document
    //  on client-side, the field which is not present is not modified in the minimongo
    //  in tabular displays, field presence is not affected
    //  e.g. notes indicator in tabular display doesn't disappear when the unset 'notes' field is not published
    //  => so the reason fo why the 'notes' field must be published as undefined
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
    _keepFields: [
        // services.password.reset is needed by AccountsUI to check and reset the password
        // services.password is needed by IzIAM to be able to identify the source of authority of a user 
        //  but acOptions.cleanRegexes removes services.password other subkeys
        'services\.password\.reset'
    ],
    async cleanupUserDocument( instance, itemDoc, options={} ){
        check( instance, AccountsCore.Account );
        const debugId = 'fCLx5S2jHQSPhRA5A';
        if( itemDoc ){
            const removeRegexes = instance.opts().cleanRegexes() || [];
            const keepRegexes = AccountsCore.Transforms._keepFields || [];

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
                                //if( itemDoc._id === debugId ) logger.debug( 'deleting one', key );
                                delete node[key];
                            }
                        } else {
                            //if( itemDoc._id === debugId ) logger.debug( 'deleting two', key );
                            delete node[key];
                        }
                    } else if( _isTraversable( value )){
                        _cleanup( value, path );

                        // cleanup emptied objects
                        if( _.isObject( value ) && !Array.isArray( value ) && !_.isDate( value ) && Object.keys( value ).length === 0 ){
                            //if( itemDoc._id === debugId ) logger.debug( 'deleting three', key );
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
    },

    // remove the 'services' object as we don't want update it ourselves here
    async removeServices( instance, itemDoc, options={} ){
        delete itemDoc.services;
        return itemDoc;
    }
};
