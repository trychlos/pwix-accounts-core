/*
 * pwix:accounts-core/src/common/classes/ac-options.class.js
 *
 * This class manages the global configuration options.
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { Options } from 'meteor/pwix:options';

const logger = Logger.get();

export class acOptions extends Options.Base {

    // static data
    //

    static _defaults = {
        allowFn: null,
        cleanRegexes: [
            'resume',
            'password',
            'profile'
        ],
        haveEmailAddress: AccountsCore.C.Identifier.MANDATORY,
        haveUsername: AccountsCore.C.Identifier.NONE,
        hooksCommon: {
            createUserFn: null,
            createUserArgs: null,
            updateUserFn: null,
            updateUserArgs: null,
            deleteUserFn: null,
            deleteUserArgs: null
        },
        hooksServer: {
            preInsertFn: null,
            postInsertFn: null,
            preUpdateFn: null,
            postUpdateFn: null,
            preDeleteFn: null,
            postDeleteFn: null
        },
        informWrongEmail: AccountsCore.C.WrongEmail.ERROR,
        maxEmailAddressesCount: AccountsCore.C.Cardinality.ILLIMITED,
        minEmailAddressesCount: 1,
        maxUsernamesCount: 0,
        minUsernamesCount: 0,
        name: 'users',  // instance name
        passwordLength: 10,
        passwordStrength: AccountsCore.C.Password.STRONG,
        preferredLabel: AccountsCore.C.PreferredLabel.EMAIL_ADDRESS,
        usernameLength: 6
    };

    // possible cardinalities
    static Cardinalities = [
        AccountsCore.C.Cardinality.ILLIMITED
    ];

    // have email address / username
    static Identifiers = [
        AccountsCore.C.Identifier.NONE,
        AccountsCore.C.Identifier.MANDATORY,
        AccountsCore.C.Identifier.OPTIONAL
    ];

    // possible user label
    static Labels = [
        AccountsCore.C.PreferredLabel.USERNAME,
        AccountsCore.C.PreferredLabel.EMAIL_ADDRESS
    ];

    // password strength
    static Strength = [
        AccountsCore.C.Password.VERYWEAK,
        AccountsCore.C.Password.WEAK,
        AccountsCore.C.Password.MEDIUM,
        AccountsCore.C.Password.STRONG,
        AccountsCore.C.Password.VERYSTRONG
    ];

    // inform the user of a wrong email
    static WrongEmail = [
        AccountsCore.C.WrongEmail.OK,
        AccountsCore.C.WrongEmail.ERROR
    ];

    // private data
    //

    // private functions
    //

    // public data
    //

    // public methods
    //

    /**
     * @constructor
     * @param {Object} options the options to be managed
     * 
     * The Options base class takes care of managing the known options, either as a value, or as a function which return a value.
     * In some case where the expected value is a string, the base class also can accept an object with 'i18n' key.
     * All options are accepted as long as the corresponding getter/setter method exists in this derived class.
     * 
     * @returns {acOptions}
     */
    constructor( options ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.acOptions()', arguments );
        super( options );
        return this;
    }

    /**
     * Getter/Setter
     * @param {Function} fn the allowFn function
     * @returns {Function}
     */
    allowFn( fn ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.allowFn()', arguments );
        return this.base_gsFn( 'allowFn', fn, { default: acOptions._defaults.allowFn, check: ( fn ) => { return !fn || _.isFunction( fn )}});
    }

    /**
     * Getter/Setter
     * @param {Array|Function} value the list of the regexes to remove when cleaning up the user document
     * @returns {Array}
     */
    cleanRegexes( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.cleanRegexes()', arguments );
        return this.base_gsRegexArrayFn( 'cleanRegexes', value, { default: acOptions._defaults.cleanRegexes });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value the name of the underlying collection, defaulting to instance name
     * @returns {String}
     *  See acInstance.collection() for the Mongo collection
     */
    collection( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.collection()', arguments );
        return this.base_gsStringObjectFn( 'collection', value, { default: this.name() });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value whether the application wants an email address
     * @returns {String}
     */
    haveEmailAddress( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.haveEmailAddress()', arguments );
        return this.base_gsStringObjectFn( 'haveEmailAddress', value, { default: acOptions._defaults.haveEmailAddress, ref: acOptions.Identifiers });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value whether the application wants a username
     * @returns {String}
     */
    haveUsername( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.haveUsername()', arguments );
        return this.base_gsStringObjectFn( 'haveUsername', value, { default: acOptions._defaults.haveUsername, ref: acOptions.Identifiers });
    }

    /**
     * Getter/Setter
     * @param {Object|Function} value the createUserArgs common hook arguments
     * @returns {Object}
     */
    hooksCommon_createUserArgs( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_createUserArgs()', arguments );
        return this.base_gsObjectFn( 'hooksCommon.createUserArgs', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the createUserFn common hook
     * @returns {Function}
     */
    hooksCommon_createUserFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_createUserFn()', arguments );
        return this.base_gsFn( 'hooksCommon.createUserFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Object|Function} value the deleteUserArgs common hook arguments
     * @returns {Object}
     */
    hooksCommon_deleteUserArgs( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_deleteUserArgs()', arguments );
        return this.base_gsObjectFn( 'hooksCommon.deleteUserArgs', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the deleteUserFn common hook
     * @returns {Function}
     */
    hooksCommon_deleteUserFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_deleteUserFn()', arguments );
        return this.base_gsFn( 'hooksCommon.deleteUserFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Object|Function} value the updateUserArgs common hook arguments
     * @returns {Object}
     */
    hooksCommon_updateUserArgs( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_updateUserArgs()', arguments );
        return this.base_gsObjectFn( 'hooksCommon.updateUserArgs', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the updateUserFn common hook
     * @returns {Function}
     */
    hooksCommon_updateUserFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksCommon_updateUserFn()', arguments );
        return this.base_gsFn( 'hooksCommon.updateUserFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the postDeleteFn server hook
     * @returns {Function}
     */
    hooksServer_postDeleteFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_postDeleteFn()', arguments );
        return this.base_gsFn( 'hooksServer.postDeleteFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the postInsertFn server hook
     * @returns {Function}
     */
    hooksServer_postInsertFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_postInsertFn()', arguments );
        return this.base_gsFn( 'hooksServer.postInsertFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the postUpdateFn server hook
     * @returns {Function}
     */
    hooksServer_postUpdateFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_postUpdateFn()', arguments );
        return this.base_gsFn( 'hooksServer.postUpdateFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the preDeleteFn server hook
     * @returns {Function}
     */
    hooksServer_preDeleteFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_preDeleteFn()', arguments );
        return this.base_gsFn( 'hooksServer.preDeleteFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the preInsertFn server hook
     * @returns {Function}
     */
    hooksServer_preInsertFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_preInsertFn()', arguments );
        return this.base_gsFn( 'hooksServer.preInsertFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Function} value the preUpdateFn server hook
     * @returns {Function}
     */
    hooksServer_preUpdateFn( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.hooksServer_preUpdateFn()', arguments );
        return this.base_gsFn( 'hooksServer.preUpdateFn', value, { default: null });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value how to inform the user of a bad email address when asking for resetting a password
     * @returns {String}
     */
    informWrongEmail( value ){
        return this.base_gsStringFn( 'informWrongEmail', value, { default: acOptions._defaults.informWrongEmail, ref: acOptions.WrongEmail });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the maximum email addresses count, defaulting to 1
     * @returns {String}
     */
    maxEmailAddressesCount( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.maxEmailAddressesCount()', arguments );
        return this.base_gsIntegerStringFn( 'maxEmailAddressesCount', value, { default: acOptions._defaults.maxEmailAddressesCount, ref: acOptions.Cardinalities });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the minimum email addresses count, defaulting to 1
     * @returns {String}
     */
    minEmailAddressesCount( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.minEmailAddressesCount()', arguments );
        return this.base_gsIntegerFn( 'minEmailAddressesCount', value, { default: acOptions._defaults.minEmailAddressesCount });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the maximum usernames count, defaulting to 1
     * @returns {String}
     */
    maxUsernamesCount( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.maxUsernamesCount()', arguments );
        return this.base_gsIntegerStringFn( 'maxUsernamesCount', value, { default: acOptions._defaults.maxUsernamesCount, ref: acOptions.Cardinalities });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the minimum email addresses count, defaulting to 1
     * @returns {String}
     */
    minUsernamesCount( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.minUsernamesCount()', arguments );
        return this.base_gsIntegerFn( 'minUsernamesCount', value, { default: acOptions._defaults.minUsernamesCount });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value the name of the instance, defaulting to 'users'
     * @returns {String}
     */
    name( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.name()', arguments );
        return this.base_gsStringObjectFn( 'name', value, { default: acOptions._defaults.name });
    }

    /**
     * Getter/Setter
     * @param {Integer|Function} value required password length
     *  must be greater or equal to zero
     *  default to DEF_PASSWORD_LENGTH
     * @returns {Integer}
     */
    passwordLength( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.passwordLength()', arguments );
        return this.base_gsIntegerFn( 'passwordLength', value, { check: ( val ) => { return val >= 0 }, default: acOptions._defaults.passwordLength });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value required password strength
     * @returns {String}
     */
    passwordStrength( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.passwordStrength()', arguments );
        return this.base_gsStringFn( 'passwordStrength', value, { default: acOptions._defaults.passwordStrength, ref: acOptions.Strength });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value preferred label when displaying a user
     * @returns {String}
     */
    preferredLabel( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.preferredLabel()', arguments );
        return this.base_gsStringObjectFn( 'preferredLabel', value, { default: acOptions._defaults.preferredLabel, ref: acOptions.Labels });
    }

    /**
     * Getter/Setter
     * @param {Object} value an object as described in the README (acAccount#trasnform)
     * @returns {Object}
     */
    transform( value ){
        return this.base_gsObjectFn( 'transform', value, { default: acOptions._defaults.transform });
    }

    /**
     * Getter/Setter
     * @param {Integer|Function} value required username length
     * @returns {Integer}
     */
    usernameLength( value ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acOptions.usernameLength()', arguments );
        return this.base_gsIntegerFn( 'usernameLength', value, { check: ( val ) => { return val >= 0 }, default: acOptions._defaults.usernameLength });
    }
}
