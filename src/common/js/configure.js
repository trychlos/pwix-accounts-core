/*
 * pwix:accounts-hub/src/common/js/config.js
 */

import _ from 'lodash';

import { ReactiveVar } from 'meteor/reactive-var';

let _conf = {};
AccountsHub._conf = new ReactiveVar( _conf );

AccountsHub._defaults = {
    autoUsers: true,
    verbosity: AccountsHub.C.Verbose.CONFIGURE
};

/**
 * @summary Get/set the package configuration
 *  Should be called *in same terms* both by the client and the server.
 * @param {Object} o configuration options
 * @returns {Object} the package configuration
 */
AccountsHub.configure = function( o ){
    if( o && _.isObject( o )){
        // check that keys exist
        let built_conf = {};
        Object.keys( o ).forEach(( it ) => {
            if( Object.keys( AccountsHub._defaults ).includes( it )){
                built_conf[it] = o[it];
            } else {
                console.warn( 'pwix:accounts-hub configure() ignore unmanaged key \''+it+'\'' );
            }
        });
        if( Object.keys( built_conf ).length ){
            _conf = _.merge( AccountsHub._defaults, _conf, built_conf );
            AccountsHub._conf.set( _conf );
            // be verbose if asked for
            if( _conf.verbosity & AccountsHub.C.Verbose.CONFIGURE ){
                console.log( 'pwix:accounts-hub configure() with', built_conf );
            }
        }
    }
    // also acts as a getter
    return AccountsHub._conf.get();
}

_conf = _.merge( {}, AccountsHub._defaults );
AccountsHub._conf.set( _conf );
