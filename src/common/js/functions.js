/*
 * pwix:accounts-hub/src/common/js/functions.js
 */

import _ from 'lodash';
import { strict as assert } from 'node:assert';

import { Logger } from 'meteor/pwix:logger';
import { Tracker } from 'meteor/tracker';

AccountsHub._instances = {
    dep: new Tracker.Dependency(),
    data: {}
};

const logger = Logger.get();

/**
 * @locus Anywhere
 * @param {String|Object} userA
 * @param {String|Object} userB
 * @returns {Boolean} whether userA and userB are same
 */
AccountsHub.areSame = function( userA, userB ){
    logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'areSame()', arguments );
    const idA = userA ? ( _.isObject( userA ) ? userA._id : ( _.isString( userA ) ? userA : null )) : null;
    const idB = userB ? ( _.isObject( userB ) ? userB._id : ( _.isString( userB ) ? userB : null )) : null;
    if( idA === null ){
        logger.warn( 'areSame() unable to get user identifier from', userA );
    }
    if( idB === null ){
        logger.warn( 'areSame() unable to get user identifier from', userB );
    }
    const res = ( idA === idB );
    return res;
}

/**
 * @locus Anywhere
 * @param {String} name the name of a tabular
 * @returns {ahClass} the corresponding ahClass instance, or null
 */
AccountsHub.getByTabularName = function( name ){
    logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'getByTabularName()', arguments );
    assert( name && _.isString( name ), 'expects a string, got '+name );
    let found = null;
    Object.values( AccountsHub._instances.data ).every(( it ) => {
        if( it.tabularName() === name ){
            found = it;
        }
        return !found;
    });
    return found;
}

/**
 * Getter/Setter
 * @locus Anywhere
 * @param {String} name
 * @param {ahClass} instance
 * @returns {ahClass} the named ahClass instance, or null
 *  A reactive data source
 *  As a setter, this function is only called by the ahClass constructor.
 */
AccountsHub.getInstance = function( name, instance ){
    logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'getInstance()', arguments );
    assert( name && _.isString( name ), 'expects a string, got '+name );
    if( instance ){
        assert( instance instanceof AccountsHub.ahClass, 'expects an instance of AccountsHub.ahClass, got '+instance );
        AccountsHub._instances.data[name] = instance;
        AccountsHub._instances.dep.changed();
    } else {
        //logger.debug( 'getInstance()', AccountsHub._instances.data );
        instance = AccountsHub._instances.data[name] || null;
        AccountsHub._instances.dep.depend();
    }
    return instance;
}
