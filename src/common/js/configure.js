/*
 * pwix:accounts-hub/src/common/js/config.js
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

const logger = Logger.get();

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
                logger.warn( 'configure() ignore unmanaged key \''+it+'\'' );
            }
        });
        if( Object.keys( built_conf ).length ){
            _conf = _.merge( AccountsHub._defaults, _conf, built_conf );
            AccountsHub._conf.set( _conf );
            logger.verbose({ verbosity: _conf.verbosity, against: AccountsHub.C.Verbose.CONFIGURE }, 'configure() with', built_conf );
        }
    }
    // also acts as a getter
    return AccountsHub._conf.get();
}

_conf = _.merge( {}, AccountsHub._defaults );
AccountsHub._conf.set( _conf );

// we warn when 'autoUsers' is left to its default 'true' while we have the pwix:accounts-manager package too in the application
// the autoUsers is a facility to make this package as transparent for possible for simple applications
// as soon as we have a Accounts manager, we need amClass'es, and so must no leave this AccountsHub creates itself the 'users' collection
Tracker.autorun(() => {
    const autoUsers = AccountsHub.configure().autoUsers;
    const haveManager = Object.keys( Package ).includes( 'pwix:accounts-manager' ) && Object.keys( Package['pwix:accounts-manager'] ).includes( 'AccountsManager' );
    if( autoUsers && haveManager ){
        logger.warning( ''
            +'\'autoUsers\' is found left to its default configuration value (\'true\') while \'pwix:accounts-manager\' package is present: you should NOT keep both. '
            +'If you need an Accounts manager, then leave it manage its accounts, and configure \'autoUsers\' to \'false\''
        );
    }
});
