/*
 * pwix:accounts/src/common/classes/ac_options_global_conf.class.js
 *
 * This class manages the global configuration options.
 */

import { Logger } from 'meteor/pwix:logger';
import { Options } from 'meteor/pwix:options';

const logger = Logger.get();

export class ahOptions extends Options.Base {

    // static data
    //

    static _defaults = {
        haveEmailAddress: AccountsHub.C.Identifier.MANDATORY,
        haveUsername: AccountsHub.C.Identifier.NONE,
        informWrongEmail: AccountsHub.C.WrongEmail.ERROR,
        maxEmailAddressesCount: 1,
        minEmailAddressesCount: 1,
        maxUsernamesCount: 0,
        minUsernamesCount: 0,
        name: 'users',
        onSignin: Meteor.loginWithPassword,
        passwordLength: 10,
        passwordStrength: AccountsHub.C.Password.STRONG,
        preferredLabel: AccountsHub.C.PreferredLabel.EMAIL_ADDRESS,
        sendVerificationEmail: true,
        usernameLength: 6
    };

    // possible cardinalities
    static Cardinalities = [
        AccountsHub.C.Cardinality.ILLIMITED
    ];

    // have email address / username
    static Identifiers = [
        AccountsHub.C.Identifier.NONE,
        AccountsHub.C.Identifier.MANDATORY,
        AccountsHub.C.Identifier.OPTIONAL
    ];

    // possible user label
    static Labels = [
        AccountsHub.C.PreferredLabel.USERNAME,
        AccountsHub.C.PreferredLabel.EMAIL_ADDRESS
    ];

    // password strength
    static Strength = [
        AccountsHub.C.Password.VERYWEAK,
        AccountsHub.C.Password.WEAK,
        AccountsHub.C.Password.MEDIUM,
        AccountsHub.C.Password.STRONG,
        AccountsHub.C.Password.VERYSTRONG
    ];

    // inform the user of a wrong email
    static WrongEmail = [
        AccountsHub.C.WrongEmail.OK,
        AccountsHub.C.WrongEmail.ERROR
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
     * Constructor
     * @param {Object} options the options to be managed
     * 
     * The Options base class takes care of managing the known options, either as a value, or as a function which return a value.
     * In some case where the expected value is a string, the base class also can accept an object with 'i18n' key.
     * All options are accepted as long as the corresponding getter/setter method exists in this derived class.
     * 
     * @returns {ahOptions}
     */
    constructor( options ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.ahOptions()', arguments );
        super( options );
        return this;
    }

    /**
     * Getter/Setter
     * @param {String|Function} value the name of the underlying collection, defaulting to instance name
     * @returns {String}
     *  See ahInstance.collection() for the Mongo collection
     */
    collection( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.collection()', arguments );
        return this.base_gsStringObjectFn( 'collection', value, { default: this.name() });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value whether the application wants an email address
     * @returns {String}
     */
    haveEmailAddress( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.haveEmailAddress()', arguments );
        return this.base_gsStringObjectFn( 'haveEmailAddress', value, { default: ahOptions._defaults.haveEmailAddress, ref: ahOptions.Identifiers });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value whether the application wants a username
     * @returns {String}
     */
    haveUsername( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.haveUsername()', arguments );
        return this.base_gsStringObjectFn( 'haveUsername', value, { default: ahOptions._defaults.haveUsername, ref: ahOptions.Identifiers });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value how to inform the user of a bad email address when asking for resetting a password
     * @returns {String}
     */
    informWrongEmail( value ){
        return this.base_gsStringFn( 'informWrongEmail', value, { default: ahOptions._defaults.informWrongEmail, ref: ahOptions.WrongEmail });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the maximum email addresses count, defaulting to 1
     * @returns {String}
     */
    maxEmailAddressesCount( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.maxEmailAddressesCount()', arguments );
        return this.base_gsIntegerStringFn( 'maxEmailAddressesCount', value, { default: ahOptions._defaults.maxEmailAddressesCount, ref: ahOptions.Cardinalities });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the minimum email addresses count, defaulting to 1
     * @returns {String}
     */
    minEmailAddressesCount( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.minEmailAddressesCount()', arguments );
        return this.base_gsIntegerFn( 'minEmailAddressesCount', value, { default: ahOptions._defaults.minEmailAddressesCount });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the maximum usernames count, defaulting to 1
     * @returns {String}
     */
    maxUsernamesCount( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.maxUsernamesCount()', arguments );
        return this.base_gsIntegerStringFn( 'maxUsernamesCount', value, { default: ahOptions._defaults.maxUsernamesCount, ref: ahOptions.Cardinalities });
    }

    /**
     * Getter/Setter
     * @param {Integer|String|Function} value the minimum email addresses count, defaulting to 1
     * @returns {String}
     */
    minUsernamesCount( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.minUsernamesCount()', arguments );
        return this.base_gsIntegerFn( 'minUsernamesCount', value, { default: ahOptions._defaults.minUsernamesCount });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value the name of the instance, defaulting to 'users'
     * @returns {String}
     */
    name( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.name()', arguments );
        return this.base_gsStringObjectFn( 'name', value, { default: ahOptions._defaults.name });
    }

    /**
     * Getter/Setter
     * @param {Function} value a callback function
     * @returns {String}
     */
    onSignin( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.onSignin()', arguments );
        return this.base_gsFn( 'onSignin', value, { default: ahOptions._defaults.onSignin });
    }

    /**
     * Getter/Setter
     * @param {Integer|Function} value required password length
     *  must be greater or equal to zero
     *  default to DEF_PASSWORD_LENGTH
     * @returns {Integer}
     */
    passwordLength( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.passwordLength()', arguments );
        return this.base_gsIntegerFn( 'passwordLength', value, { check: ( val ) => { return val >= 0 }, default: ahOptions._defaults.passwordLength });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value required password strength
     * @returns {String}
     */
    passwordStrength( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.passwordStrength()', arguments );
        return this.base_gsStringFn( 'passwordStrength', value, { default: ahOptions._defaults.passwordStrength, ref: ahOptions.Strength });
    }

    /**
     * Getter/Setter
     * @param {String|Function} value preferred label when displaying a user
     * @returns {String}
     */
    preferredLabel( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.preferredLabel()', arguments );
        return this.base_gsStringObjectFn( 'preferredLabel', value, { default: ahOptions._defaults.preferredLabel, ref: ahOptions.Labels });
    }

    /**
     * Getter/Setter
     * @param {Boolean|Function} flag whether we want an email verification be sent on user creation
     * @returns {Boolean}
     */
    sendVerificationEmail( flag ){
        return this.base_gsBoolFn( 'sendVerificationEmail', flag, { default: ahOptions._defaults.sendVerificationEmail });
    }

    /**
     * Getter/Setter
     * @param {Function} fn extension of the 'all' publication
     * @returns {Function}
     */
    serverAllExtend( fn ){
        return this.base_gsFn( 'serverAllExtend', fn, { default: null });
    }

    /**
     * Getter/Setter
     * @param {Integer|Function} value required username length
     * @returns {Integer}
     */
    usernameLength( value ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahOptions.usernameLength()', arguments );
        return this.base_gsIntegerFn( 'usernameLength', value, { check: ( val ) => { return val >= 0 }, default: ahOptions._defaults.usernameLength });
    }
}
