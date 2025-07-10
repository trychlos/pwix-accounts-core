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
        let notexist = [];
        Object.keys( o ).forEach(( it ) => {
            if( !Object.keys( AccountsHub._defaults ).includes( it )){
                notexist.push( it );
            }
        });
        if( notexist.length ){
            console.warn( 'pwix:accounts-hub ignoring (re)configuration due to not existing keys', notexist );
        } else {
            _conf = _.merge( AccountsHub._defaults, _conf, o );
            AccountsHub._conf.set( _conf );
            // be verbose if asked for
            if( _conf.verbosity & AccountsHub.C.Verbose.CONFIGURE ){
                console.log( 'pwix:accounts-hub configure() with', o );
            }
        }
    }
    // also acts as a getter
    return AccountsHub._conf.get();
}

_conf = _.merge( {}, AccountsHub._defaults );
AccountsHub._conf.set( _conf );
