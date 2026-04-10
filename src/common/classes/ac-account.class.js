/*
 * pwix:accounts-core/src/common/classes/ac-account.class.js
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { Mongo } from 'meteor/mongo';
import { Options } from 'meteor/pwix:options';

import { acOptions } from './ac-options.class.js';

import { acChecks } from '../helpers/ac-checks.js';

const logger = Logger.get();

export class acAccount {

    // private data

    #args = null;
    #opts = null;

    // runtime data

    // the mongo collection
    //  see this.opts().collection() for the collection name
    #collection = null;

    // private methods

    // @locus Server
    // @summary Deny all client-side updates
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

    // @locus Server
    // @summary Initialize the transformation functions
    //  Even if this is only used on server, we leave the method run in common code to make the life easier
    _initTransformationArrays(){
        if( Meteor.isServer ){
            this._transforms = this._transforms || {};
            // publication transformations
            this._transforms.pub = this._transforms.pub || {};
            for( const name of [ AccountsCore.C.pub.listAll.name ] ){
                this._transforms.pub[name] = this._transforms.pub[name] || [];
                this._transforms.pub[name].push( AccountsCore.Transforms.addDyn );
                this._transforms.pub[name].push( AccountsCore.Transforms.addPreferredLabel );
                this._transforms.pub[name].push( AccountsCore.Transforms.addUndefined );
                this._transforms.pub[name].push( AccountsCore.Transforms.cleanupUserDocument );
            }
            // read transformations
            this._transforms.read = this._transforms.read || [];
            this._transforms.read.push( AccountsCore.Transforms.addDyn );
            this._transforms.read.push( AccountsCore.Transforms.addPreferredLabel );
            this._transforms.read.push( AccountsCore.Transforms.cleanupUserDocument );
            // update transformations
            this._transforms.update = this._transforms.update || [];
            this._transforms.update.push( AccountsCore.Transforms.removeDyn );
        }
    }

    // @summary returns the preferred label for the user
    // @locus Anywhere
    // @param {Object} user the user document got from the database
    // @param {String} preferred an optional preference, either AccountsCore.C.PreferredLabel.USERNAME or AccountsCore.C.PreferredLabel.EMAIL_ADDRESS,
    //  defaulting to the configured value.
    // @param {Object} the result object to be updated
    // @returns: {Object}
    _preferredLabelByDoc( user, preferred, result ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount._preferredLabelByDoc()', arguments );
        check( user, Match.ObjectIncluding({ _id: Match.NonEmptyString }));
        let mypref = preferred;
        if( !mypref || !Object.keys( AccountsCore.C.PreferredLabel ).includes( mypref )){
            mypref = this.opts().preferredLabel();
        }
        if( mypref === AccountsCore.C.PreferredLabel.USERNAME && user.username ){
            result = { label: user.username, origin: AccountsCore.C.PreferredLabel.USERNAME };

        } else if( mypref === AccountsCore.C.PreferredLabel.USERNAME && user.usernames && user.usernames[0].username ){
            result = { label: user.usernames[0].username, origin: AccountsCore.C.PreferredLabel.USERNAME };

        } else if( mypref === AccountsCore.C.PreferredLabel.EMAIL_ADDRESS && user.emails && user.emails[0].address ){
            result = { label: user.emails[0].address, origin: AccountsCore.C.PreferredLabel.EMAIL_ADDRESS };

        } else if( user.username ){
            logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.PREFERREDLABEL }, 'acAccount._preferredLabelByDoc() fallback to username while preferred is', mypref );
            result = { label: user.username, origin: AccountsCore.C.PreferredLabel.USERNAME };

        } else if( user.usernames && user.usernames[0].username ){
            logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.PREFERREDLABEL }, 'acAccount._preferredLabelByDoc() fallback to usernames while preferred is', mypref );
            result = { label: user.usernames[0].username, origin: AccountsCore.C.PreferredLabel.USERNAME };

        } else if( user.emails && user.emails[0].address ){
            logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.PREFERREDLABEL }, 'acAccount._preferredLabelByDoc() fallback to (truncated) email address name while preferred is', mypref );
            const words = user.emails[0].address.split( '@' );
            result = { label: words[0], origin: AccountsCore.C.PreferredLabel.EMAIL_ADDRESS };
        }
        return result;
    };

    // @summary Returns the preferred label for the user
    // @locus Anywhere
    // @param {String|AccountsCore.Account} instance
    // @param {String} id the user identifier
    // @param {String} preferred the optional caller preference, may be null
    // @param {Object} the result object
    // @returns {Promise} which eventually resolves to the result object, or null if user has not been found
    async _preferredLabelById( id, preferred, result ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount._preferredLabelById()', arguments );
        const userDoc = await this.byId( id );
        if( userDoc ){
            return this._preferredLabelByDoc( userDoc, preferred, result );
        }
        return null;
    }

    // @summary Returns the preferredLabel initial result, or null
    // @locus Anywhere
    // @returns {Object} the initial result
    _preferredLabelInitialResult( arg, preferred ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount._preferredLabelInitialResult()', arguments );
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
    };

    // protected methods

    // Setter
    // @summary set the options from the derived class
    _setOpts( opts ){
        check( opts, Options.Base );
        this.#opts = opts;
    }

    // public methods

    /**
     * @constructor
     * @param {Object} args the instanciation arguments
     * 
     * The Options base class takes care of managing the known options, either as a value, or as a function which return a value.
     * When the expected value is a string, the class also accepts an object with 'i18n' key.
     * All options are accepted as long as the corresponding getter/setter method exists in the Options class.
     * 
     * @returns {acAccount}
     */
    constructor( args ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount()', ...arguments );
        this.#args = args;
        this.#opts = new acOptions( args );

        // if the name is already instanciated, then just return it
        const instance = AccountsCore.getInstance( this.name());
        if( instance ){
            logger.info( 'pwix:accounts-core returning already instanciated acInstance', this.name());
            return instance;
        }

        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.INSTANCE }, 'acAccount() instanciated for', this.opts().name());

        // define the Mongo collection
        if( this.opts().collection() === 'users' ){
            //logger.debug( 'pwix:accounts-core using users collection' );
            this.#collection = Meteor.users;
        } else {
            //logger.debug( 'pwix:accounts-core defining collection', this.opts().collection());
            this.#collection = new Mongo.Collection( this.opts().collection());
        }
        // server-side: deny all client-side direct updates
        this._deny();
        // server-side: init transformation functions
        this._initTransformationArrays();

        // register this new instance
        AccountsCore._setInstance( this.name(), this );

        return this;
    }

    /**
     * @locus Anywhere
     * @param {String} identifier
     * @param {Object} options an optional Mongo options object
     * @returns {Object} the unique found user document, or null
     */
    async byAnyIdentifier( identifier, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.byAnyIdentifier()', arguments );
        if( Meteor.isClient ){
            return await Meteor.callAsync( 'pwix.AccountsCore.m.byAnyIdentifier', this.name(), identifier, options );
        }
        return await AccountsCore.s.byAnyIdentifier( this, identifier );
    };

    /**
     * @locus Anywhere
     * @param {String} email
     * @param {Object} options an optional Mongo options object
     * @returns {Object} the unique found user document, or null
     */
    async byEmailAddress( email, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.byEmailAddress()', arguments );
        if( Meteor.isClient ){
            return await Meteor.callAsync( 'pwix.AccountsCore.m.byEmailAddress', this.name(), email, options );
        }
        return await AccountsCore.s.byEmailAddress( this, email );
    };

    /**
     * @locus Anywhere
     * @param {String} id
     * @param {Object} options an optional Mongo options object
     * @returns {Object} the unique found user document, or null
     */
    async byId( id, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.byId()', arguments );
        if( Meteor.isClient ){
            return await Meteor.callAsync( 'pwix.AccountsCore.m.byQuery', this.name(), { _id: id }, options );
        }
        return await AccountsCore.s.byQuery( this, { _id: id } );
    };

    /**
     * @locus Anywhere
     * @param {String} username
     * @param {Object} options an optional Mongo options object
     * @returns {Object} the unique found user document, or null
     */
    async byUsername( username, options={} ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.byUsername()', arguments );
        if( Meteor.isClient ){
            return await Meteor.callAsync( 'pwix.AccountsCore.m.byUsername', this.name(), username, options );
        }
        return await AccountsCore.s.byUsername( this, username );
    };

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
        return await acChecks.checkEmailAddress( this, email, opts );
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
        return await acChecks.checkPassword( this, password, opts );
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
        return await acChecks.checkUsername( this, username, opts );
    }

    /**
     * Getter
     * @returns {Mongo.Collection} the Mongo collection attached to this instance
     *  See this.opts().collection() for the collection name
     */
    collection(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.collection()' );
        return this.#collection;
    }

    /**
     * @locus Anywhere
     * @returns {Boolean} whether the instance wants have at least one email address
     */
    emailAtLeastOne(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.emailAtLeastOne()' );
        const minCount = this.emailMinCount();
        const atLeastOne = ( minCount >= 1 );
        return atLeastOne;
    };

    /**
     * @locus Anywhere
     * @returns {Boolean} whether the instance may have one (or more) email address(es) - which means that zero is OK
     */
    emailMayHaveOne(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.emailMayHaveOne()' );
        let haveOne = true;
        const options = this.opts().base_get_set_options();
        if( options.includes( 'haveEmailAddress' )){
            switch( this.opts().haveEmailAddress()){
                case AccountsCore.C.Identifier.NONE:
                    haveOne = false;
                    break;
                case AccountsCore.C.Identifier.OPTIONAL:
                case AccountsCore.C.Identifier.MANDATORY:
                    haveOne = true;
                    break;
            }
        } else {
            const max = this.opts().maxEmailAddressesCount();
            haveOne = ( max !== 0 );
        }
        return haveOne;
    };

    /**
     * @locus Anywhere
     * @returns {Integer} the desired maximal count of email addresses
     */
    emailMaxCount(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.emailMaxCount()' );
        maxCount = this.opts().maxEmailAddressesCount();
        return maxCount;
    };

    /**
     * @locus Anywhere
     * @returns {Integer} the desired minimal count of email addresses
     */
    emailMinCount(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.emailMinCount()' );
        let minCount = -1;
        const options = this.opts().base_get_set_options();
        if( options.includes( 'haveEmailAddress' )){
            switch( this.opts().haveEmailAddress()){
                case AccountsCore.C.Identifier.NONE:
                case AccountsCore.C.Identifier.OPTIONAL:
                    minCount = 0;
                    break;
                case AccountsCore.C.Identifier.MANDATORY:
                    minCount = 1;
                    break;
            }
        } else {
            minCount = this.opts().minEmailAddressesCount();
        }
        return minCount;
    };

    /**
     * Getter
     * @returns {String} the name of this instance
     */
    name(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.name()' );
        return this.opts().name();
    }

    /**
     * Getter
     * @returns {acOptions} the instanciation options
     */
    opts(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.opts()' );
        return this.#opts;
    }

    /**
     * @summary Returns the preferred label for the user
     * @locus Anywhere
     * @param {String|Object} user the user identifier or the user document
     * @param {String} preferred the optional caller preference, either AccountsCore.C.PreferredLabel.USERNAME or AccountsCore.C.PreferredLabel.EMAIL_ADDRESS,
     *  defaulting to the value configured at instanciation time
     * @returns {Promise} a Promise which eventually will resolve to an object with following keys:
     *  - label: the computed preferred label
     *  - origin: the origin, which may be 'ID' or AccountsCore.C.PreferredLabel.USERNAME or AccountsCore.C.PreferredLabel.EMAIL_ADDRESS
     */
    async preferredLabel( user, preferred=null ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.preferredLabel()', arguments );
        check( user, Match.OneOf( Match.NonEmptyString, Match.ObjectIncluding({ _id: Match.NonEmptyString })));
        let result = this._preferredLabelInitialResult( user, preferred );
        if( result ){
            // if a user identifier is provided, returns a Promise which resolves to the updated result object
            if( _.isString( user )){
                result = await this._preferredLabelById( user, preferred || this.opts().preferredLabel(), result );
                //logger.debug( '_preferredLabelById', result );
                return result;
            }
            // else expects a user document
            if( _.isString( user._id )){
                result = await this._preferredLabelByDoc( user, preferred || this.opts().preferredLabel(), result );
                //logger.debug( '_preferredLabelByDoc', result );
                return result;
            }
        }
        logger.error( 'AccountsCore.preferredLabel() unable to compute a suitable value' );
        return null;
    };

    /**
     * Getter
     * @locus Anywhere
     * @param {String} name the name of the publication
     * @returns {Array<Function>} the transformation functions array for named publication
     *  Even if useless on the client, we still return an empty object to make the caller life easier
     */
    transformsPublish( name ){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.transformsPublish()' );
        check( name, Match.NonEmptyString );
        if( Meteor.isClient ){
            return null;
        }
        this._transforms = this._transforms || {};
        this._transforms.pub = this._transforms.pub || {};
        this._transforms.pub[name] = this._transforms.pub[name] || [];
        return this._transforms.pub[name];
    }

    /**
     * Getter
     * @locus Anywhere
     * @returns {Array<Function>} the transformation functions array for read accesses
     */
    transformsRead(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.transformsRead()' );
        if( Meteor.isClient ){
            return null;
        }
        this._transforms = this._transforms || {};
        this._transforms.read = this._transforms.read || [];
        return this._transforms.read;
    }

    /**
     * Getter
     * @locus Anywhere
     * @returns {Array<Function>} the transformation functions array for update accesses
     */
    transformsUpdate(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.transformsUpdate()' );
        if( Meteor.isClient ){
            return null;
        }
        this._transforms = this._transforms || {};
        this._transforms.update = this._transforms.update || [];
        return this._transforms.update;
    }

    /**
     * @locus Anywhere
     * @returns {Boolean} whether the instance wants have at least one username
     */
    usernameAtLeastOne(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.usernameAtLeastOne()' );
        const minCount = this.usernameMinCount();
        const atLeastOne = ( minCount >= 1 );
        return atLeastOne;
    };

    /**
     * @locus Anywhere
     * @returns {Boolean} whether the instance may have one (or more) username(s) - which means that zero is OK
     */
    usernameMayHaveOne(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.usernameMayHaveOne()' );
        let haveOne = true;
        const options = this.opts().base_get_set_options();
        if( options.includes( 'haveUsername' )){
            switch( this.opts().haveUsername()){
                case AccountsCore.C.Identifier.NONE:
                    haveOne = false;
                    break;
                case AccountsCore.C.Identifier.OPTIONAL:
                case AccountsCore.C.Identifier.MANDATORY:
                    haveOne = true;
                    break;
            }
        } else {
            const max = this.opts().maxUsernamesCount();
            haveOne = ( max !== 0 );
        }
        return haveOne;
    };

    /**
     * @locus Anywhere
     * @returns {Integer} the maximal desired count of usernames
     */
    usernameMaxCount(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.usernameMaxCount()' );
        let maxCount = this.opts().maxUsernamesCount();
        return maxCount;
    };

    /**
     * @locus Anywhere
     * @returns {Integer} the minimal desired count of usernames
     */
    usernameMinCount(){
        logger.verbose({ verbosity: AccountsCore.configure().verbosity, against: AccountsCore.C.Verbose.FUNCTIONS }, 'acAccount.usernameMinCount()' );
        let minCount = -1;
        const options = this.opts().base_get_set_options();
        if( options.includes( 'haveUsername' )){
            switch( this.opts().haveUsername()){
                case AccountsCore.C.Identifier.NONE:
                case AccountsCore.C.Identifier.OPTIONAL:
                    minCount = 0;
                    break;
                case AccountsCore.C.Identifier.MANDATORY:
                    minCount = 1;
                    break;
            }
        } else {
            minCount = this.opts().minUsernamesCount();
        }
        return minCount;
    };
}
