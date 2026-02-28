/*
 * pwix:accounts-hub/src/common/classes/ah-class.class.js
 *
 * This class manages an account entity.
 */

import _ from 'lodash';
import emailValidator from 'email-validator';
import zxcvbn from 'zxcvbn';

import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';
import { pwixI18n } from 'meteor/pwix:i18n';

import { ahOptions } from './ah-options.class.js';

const logger = Logger.get();

export class ahClass {

    // static data
    //

    // private data
    //
    #args = null;
    #opts = null;

    // runtime
    //

    // the mongo collection
    //  see this.opts().collection() for the collection name
    #collection = null;

    // private methods
    //

    /*
     * @summary: check that the proposed candidate email address is valid, and not already exists
     */
    async _checkEmailAddress( email, opts={} ){
        const self = this;
        let result = {
            ok: true,
            reason: undefined,
            errors: [],
            countOk: 0,
            countNotOk: 0,
            canonical: ( email ? email.trim() : '' ).toLowerCase()
        };
        // check if the email address is set
        const _checkSet = async function(){
            if( opts.testEmpty !== false ){
                if( result.canonical ){
                    result.countOk += 1;
                } else {
                    result.ok = false;
                    result.reason = 'email_empty';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                }
            }
        };
        await _checkSet();
        if( !result.ok ){
            return result;
        }
        // check for an email valid syntax
        const _checkSyntax = async function(){
            if( opts.testValid !== false ){
                if( emailValidator.validate( result.canonical )){
                    result.countOk += 1;
                } else {
                    result.ok = false;
                    result.reason = 'email_invalid';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                }
            }
        };
        await _checkSyntax();
        if( !result.ok ){
            return result;
        }
        // check if the email address already exists
        const _checkExists = async function(){
            if( opts.testExists !== false ){
                if( Boolean( await self.byEmailAddress( result.canonical ))){
                    result.ok = false;
                    result.reason = 'email_exists';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                } else {
                    result.countOk += 1;
                }
            }
        };
        await _checkExists();
        return result;
    }

    /*
     * @summary: check that the proposed candidate password is valid
     */
    async _checkPassword( password, opts={} ){
        const self = this;
        let result = {
            ok: true,
            reason: undefined,
            errors: [],
            countOk: 0,
            countNotOk: 0,
            minScore: -1,
            zxcvbn: null,
            canonical: password || ''
        };
        // first compute min score function of required complexity
        result.minScore = this._checkPasswordComputeMinScore();
        result.zxcvbn = zxcvbn( result.canonical );
        // check if the email address is set
        const _checkSet = async function(){
            if( opts.testEmpty !== false ){
                if( result.canonical ){
                    result.countOk += 1;
                } else {
                    result.ok = false;
                    result.reason = 'password_empty';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                }
            }
        };
        await _checkSet();
        if( !result.ok ){
            return result;
        }
        // check for minimal length
        const _checkLength = async function(){
            if( opts.testLength !== false ){
                const minLength = self.opts().passwordLength();
                if( result.canonical.length < minLength ){
                    result.ok = false;
                    result.reason = 'password_short';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason, minLength ));
                    result.countNotOk += 1;
                } else {
                    result.countOk += 1;
                }
            }
        };
        await _checkLength();
        if( !result.ok ){
            return result;
        }
        // check for complexity
        const _checkComplexity = async function(){
            if( opts.testComplexity !== false ){
                if( result.zxcvbn.score < result.minScore ){
                    result.ok = false;
                    result.reason = 'password_weak';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason, result.zxcvbn.score, result.minScore ));
                    result.countNotOk += 1;
                } else {
                    result.countOk += 1;
                }
            }
        };
        await _checkComplexity();
        return result;
    }

    // let the configured password strength be converted into a zxcvbn score
    #scores = [
        AccountsHub.C.Password.VERYWEAK,
        AccountsHub.C.Password.WEAK,
        AccountsHub.C.Password.MEDIUM,
        AccountsHub.C.Password.STRONG,
        AccountsHub.C.Password.VERYSTRONG
    ];

    _checkPasswordComputeMinScore(){
        const strength = this.opts().passwordStrength();
        let minScore = -1;
        for( let i=0 ; i<this.#scores.length && minScore === -1 ; ++i ){
            if( this.#scores[i] === strength ){
                minScore = i;
            }
        }
        return minScore;
    }

    /*
     * @summary: check that the proposed candidate username is valid, and not already exists
     */
    async _checkUsername( username, opts={} ){
        const self = this;
        let result = {
            ok: true,
            reason: undefined,
            errors: [],
            countOk: 0,
            countNotOk: 0,
            canonical: username ? username.trim() : ''
        };
        // check if the username is set
        const _checkSet = async function(){
            if( opts.testEmpty !== false ){
                if( result.canonical ){
                    result.countOk += 1;
                } else {
                    result.ok = false;
                    result.reason = 'username_empty';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                }
            }
        };
        await _checkSet();
        if( !result.ok ){
            return result;
        }
        // check for minimal length
        const _checkLength = async function(){
            if( opts.testLength !== false ){
                const minLength = this.opts().usernameLength();
                if( result.canonical.length < minLength ){
                    result.ok = false;
                    result.reason = 'username_short';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason, minLength ));
                    result.countNotOk += 1;
                } else {
                    result.countOk += 1;
                }
            }
        };
        await _checkLength();
        if( !result.ok ){
            return result;
        }
        // check if the username already exists
        const _checkExists = async function(){
            if( opts.testExists !== false ){
                if( Boolean( await self.byUsername( result.canonical ))){
                    result.ok = false;
                    result.reason = 'username_exists';
                    result.errors.push( pwixI18n.label( I18N, 'checks.'+result.reason ));
                    result.countNotOk += 1;
                } else {
                    result.countOk += 1;
                }
            }
        };
        await _checkExists();
        return result;
    }

    // @locus Server
    // Deny all client-side updates
    // cf. https://guide.meteor.com/security.html#allow-deny
    // see also https://docs.meteor.com/api/accounts.html#Meteor-users
    _deny(){
        if( Meteor.isServer ){
            this.collection().deny({
                insert(){ return true; },
                update(){ return true; },
                remove(){ return true; },
            });
        }
    }

    /*
     * @summary returns the preferred label for the user
     * @locus Anywhere
     * @param {Object} user the user document got from the database
     * @param {String} preferred an optional preference, either AccountsHub.C.PreferredLabel.USERNAME or AccountsHub.C.PreferredLabel.EMAIL_ADDRESS,
     *  defaulting to the configured value.
     * @param {Object} the result object to be updated
     * @returns: {Object}
     */
    _preferredLabelByDoc( user, preferred, result ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass._preferredLabelByDoc()', arguments );
        // make reasonably sure we have a user document
        if( user && _.isObject( user ) && user._id && _.isString( user._id )){
            let mypref = preferred;
            if( !mypref || !Object.keys( AccountsHub.C.PreferredLabel ).includes( mypref )){
                mypref = AccountsHub.opts().preferredLabel();
            }
            if( mypref === AccountsHub.C.PreferredLabel.USERNAME && user.username ){
                result = { label: user.username, origin: AccountsHub.C.PreferredLabel.USERNAME };

            } else if( mypref === AccountsHub.C.PreferredLabel.USERNAME && user.usernames && user.usernames[0].username ){
                result = { label: user.usernames[0].username, origin: AccountsHub.C.PreferredLabel.USERNAME };

            } else if( mypref === AccountsHub.C.PreferredLabel.EMAIL_ADDRESS && user.emails && user.emails[0].address ){
                result = { label: user.emails[0].address, origin: AccountsHub.C.PreferredLabel.EMAIL_ADDRESS };

            } else if( user.username ){
                logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.PREFERREDLABEL }, 'ahClass._preferredLabelByDoc() fallback to username while preferred is', mypref );
                result = { label: user.username, origin: AccountsHub.C.PreferredLabel.USERNAME };

            } else if( user.usernames && user.usernames[0].username ){
                logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.PREFERREDLABEL }, 'ahClass._preferredLabelByDoc() fallback to usernames while preferred is', mypref );
                result = { label: user.usernames[0].username, origin: AccountsHub.C.PreferredLabel.USERNAME };

            } else if( user.emails && user.emails[0].address ){
                logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.PREFERREDLABEL }, 'ahClass._preferredLabelByDoc() fallback to email address name while preferred is', mypref );
                const words = user.emails[0].address.split( '@' );
                result = { label: words[0], origin: AccountsHub.C.PreferredLabel.EMAIL_ADDRESS };
            }
        }
        return result;
    }

    /*
     * @summary Returns the preferred label for the user
     * @locus Anywhere
     * @param {String} arg the user identifier
     * @param {String} preferred the optional caller preference, may be null
     * @param {Object} the result object
     * @returns {Promise} which eventually resolves to the result object, or null if user has not been found
     */
    async _preferredLabelById( id, preferred, result ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass._preferredLabelById()', arguments );
        const self = this;
        return this.byId( id )
            .then(( user ) => {
                return user ? self._preferredLabelByDoc( user, preferred, result ) : null;
            });
    }

    /*
     * @summary Returns the preferredLabel initial result, or null
     * @locus Anywhere
     * @returns {Object} the initial result
     */
    _preferredLabelInitialResult( arg, preferred ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass._preferredLabelInitialResult()', arguments );
        if( arg ){
            // if a user identifier is provided
            if( _.isString( arg )){
                return {
                    label: arg,
                    origin: 'ID'
                };
            }
            if( _.isString( arg._id )){
                return {
                    label: arg._id,
                    origin: 'ID'
                };
            }
        }
        return null;
    }

    // public data
    //

    // public methods
    //

    /**
     * Constructor
     * @param {Object} args the instanciation arguments
     * 
     * The Options base class takes care of managing the known options, either as a value, or as a function which return a value.
     * In some case where the expected value is a string, the base class also can accept an object with 'i18n' key.
     * All options are accepted as long as the corresponding getter/setter method exists in this derived class.
     * 
     * @returns {ahClass}
     */
    constructor( args ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.ahClass()', arguments );
        this.#args = args;
        this.#opts = new ahOptions( args );
        //logger.debug( 'instanciating', this.name(), args );
        //console.trace( 'instanciating', this.name(), args );

        // if the name is already instanciated, then just return it
        const instance = AccountsHub.getInstance( this.name());
        if( instance ){
            logger.info( 'pwix:accounts-hub returning already instanciated ahInstance', this.name());
            return instance;
        }

        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.INSTANCE }, 'ahClass.ahClass() instanciated for', this.opts().collection());

        // define the Mongo collection
        if( this.opts().collection() === 'users' ){
            //logger.debug( 'pwix:accounts-hub using users collection' );
            this.#collection = Meteor.users;
        } else {
            //logger.debug( 'pwix:accounts-hub defining collection', this.opts().collection());
            this.#collection = new Mongo.Collection( this.opts().collection());
        }
        // and (on the server) deny all client-side direct updates
        this._deny();

        // register this new instance
        AccountsHub.getInstance( this.name(), this );
        return this;
    }

    /**
     * @locus Anywhere
     * @param {String} email
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which will eventually resolve to the cleanup user document, or null
     */
    async byEmailAddress( email, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.byEmailAddress()', arguments );
        if( !email || !_.isString( email )){
            logger.error( 'expects email be a string, got', email, 'throwing...' );
            throw new Error( 'Bad argument: email' );
        }
        if( options && !_.isObject( options )){
            logger.error( 'expects options be an object if set, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        return Meteor.isClient ? await Meteor.callAsync( 'AccountsHub.byEmailAddress', this.name(), email, options ) : await AccountsHub.s.byEmailAddress( this.name(), email, options );
    }

    /**
     * @locus Anywhere
     * @param {String} id
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which will eventually resolve to the cleanup user document, or null
     */
    async byId( id, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.byId()', arguments );
        if( !id || !_.isString( id )){
            logger.error( 'expects id be a non-empty string, got', id, 'throwing...' );
            throw new Error( 'Bad argument: id' );
        }
        if( options && !_.isObject( options )){
            logger.error( 'expects options be an object if set, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        return Meteor.isClient ? await Meteor.callAsync( 'AccountsHub.byId', this.name(), id, options ) : await AccountsHub.s.byId( this.name(), id, options );
    }

    /**
     * @locus Anywhere
     * @param {String} username
     * @param {Object} options an optional dictionary of fields to return or exclude
     * @returns {Promise} which will eventually resolve to the cleanup user document, or null
     */
    async byUsername( username, options={} ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.byUsername()', arguments );
        if( !username || !_.isString( username )){
            logger.error( 'expects username be a non-empty string, got', username, 'throwing...' );
            throw new Error( 'Bad argument: username' );
        }
        if( options && !_.isObject( options )){
            logger.error( 'expects options be an object if set, got', options, 'throwing...' );
            throw new Error( 'Bad argument: options' );
        }
        return Meteor.isClient ? await Meteor.callAsync( 'AccountsHub.byUsername', this.name(), username, options ) : await AccountsHub.s.byUsername( this.name(), username, options );
    }

    /**
     * @summary: check that the proposed candidate email address is valid, and not already exists
     * @locus Anywhere
     * @param {String} email the email address to be checked
     * @param {Object} opts:
     *  - testEmpty: whether to test if the email address is set, defaulting to true
     *  - testValid: whether to test for syntax validity, defaulting to true
     *  - testExists: whether to test for existance, defaulting to true
     * @returns {Promise} which resolves to the check result, as:
     *  - ok: true|false
     *  - reason: if not ok, the first reason
     *  - errors: an array of localized error messages
     *  - canonical: trimmed lowercase email address
     */
    async checkEmailAddress( email, opts={} ){
        return await this._checkEmailAddress( email, opts );
    }

    /**
     * @summary: check that the proposed candidate password is valid
     * @locus Anywhere
     * @param {String} password the password to be checked
     * @param {Object} opts:
     *  - testEmpty: whether to test if the password is set, defaulting to true
     *  - testLength: whether to test for password minimal length, defaulting to true
     *  - testComplexity: whether to test for password minimal complexity, defaulting to true
     * @returns {Object} the check result, as:
     *  - ok: true|false
     *  - reason: if not ok, the first reason
     *  - errors: an array of localized error messages
     *  - minScore: the minimal computed score depending of the required strength
     *  - zxcvbn: the zxcvbn computed result
     *  - canonical: the checked password
     */
    async checkPassword( password, opts={} ){
        return await this._checkPassword( password, opts );
    }

    /**
     * @summary: check that the proposed candidate username is valid, and not already exists
     * @locus Anywhere
     * @param {String} username the username to be checked
     * @param {Object} an option object with:
     *  - testEmpty: whether to test if the username is set, defaulting to true
     *  - testLength: whether to test for username minimal length, defaulting to true
     *  - testExists: whether to test for existance, defaulting to true
     * @returns {Promise} which resolves to the check result, as:
     *  - ok: true|false
     *  - errors: [] an array of localized error messages
     *  - warnings: [] an array of localized warning messages
     *  - username: trimmed username
     */
    async checkUsername( username, opts={} ){
        return await this._checkUsername( username, opts );
    }

    /**
     * Getter
     * @returns {Mongo.Collection} the Mongo collection attached to this instance
     *  See this.opts().collection() for the collection name
     */
    collection(){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.collection()' );
        return this.#collection;
    }

    /**
     * @locus Anywhere
     * @param {String} email an email address
     * @returns {Object} the default Mongo selector for this email address
     */
    emailSelector( email ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.emailSelector()', arguments );
        let selector = { 'emails.address': email };
        return selector;
    }

    /**
     * Getter
     * @returns {String} the name of this instance
     */
    name(){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.name()' );
        return this.opts().name();
    }

    /**
     * Getter
     * @returns {ahOptions} the instanciation options
     */
    opts(){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.opts()' );
        return this.#opts;
    }

    /**
     * @summary Returns the preferred label for the user
     * @locus Anywhere
     * @param {String|Object} arg the user identifier or the user document
     * @param {String} preferred the optional caller preference, either AccountsHub.C.PreferredLabel.USERNAME or AccountsHub.C.PreferredLabel.EMAIL_ADDRESS,
     *  defaulting to the value configured at instanciation time
     * @returns {Promise} a Promise which eventually will resolve to an object with following keys:
     *  - label: the computed preferred label
     *  - origin: the origin, which may be 'ID' or AccountsHub.C.PreferredLabel.USERNAME or AccountsHub.C.PreferredLabel.EMAIL_ADDRESS
     */
    async preferredLabel( arg, preferred=null ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.preferredLabel()', arguments );
        let result = this._preferredLabelInitialResult( arg, preferred );
        const self = this;
        if( result ){
            // if a user identifier is provided, returns a Promise which resolves to the updated result object
            if( _.isString( arg )){
                return Promise.resolve( result )
                    .then(() => { return self._preferredLabelById( arg, preferred || self.opts().preferredLabel(), result ); })
                    .then(( res ) => {
                        //logger.debug( 'res', res );
                        return res ? res : result;
                    });
            }
            if( _.isString( arg._id )){
                return Promise.resolve( result )
                    .then(() => { return self._preferredLabelByDoc( arg, preferred || self.opts().preferredLabel(), result ); })
                    .then(( res ) => {
                        //logger.debug( res );
                        return res;
                    });
            }
        }
        logger.error( 'AccountsHub.preferredLabel() expects at least one argument, none found' );
        return null;
    }

    /**
     * @summary 'serverAllExtend' function let the application extends the content of the All publication
     * @returns {Function} the provided function or null
     */
    serverAllExtend(){
        return this.opts().serverAllExtend();
    }

    /**
     * @locus Anywhere
     * @param {String} username
     * @returns {Object} the default Mongo selector for this username
     */
    usernameSelector = function( username ){
        logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'ahClass.usernameSelector()', arguments );
        let selector = { $or: [{ username: username }, { 'usernames.username': username }]};
        return selector;
    }
}
