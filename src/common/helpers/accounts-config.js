/*
 * pwix:accounts-core/src/common/helpers/accounts-config.js
 *
 * Some helpers to get back AccountsCommon.config() options value.
 * Rationale:
 *  AccountsCommon.config() is a function which is only to *set* configuration options values
 *  It copies only set values into '_options', without merging with any default value (which is bad, but anyway...)
 *  So we have to provide these helpers so that we manage ourselves these default values.
 * 
 * See: https://docs.meteor.com/api/accounts.html#AccountsCommon-config
 */

import _ from 'lodash';

import { Accounts } from 'meteor/accounts-base';
import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

export const AccountsConfig = {

    // the defaults as documented
    _defaults: {
        // default is not documented, but if we do not do anything, the verification email is not sent at signup time
        // but we do want new users have the possibility to validate their email, we so force the default to be true
        //sendVerificationEmail: false,
        sendVerificationEmail: true,
        forbidClientAccountCreation: false,
        restrictCreationByEmailDomain: null,
        loginExpiration: Accounts.DEFAULT_LOGIN_EXPIRATION_DAYS * 24*3600*1000,
        loginExpirationInDays: Accounts.DEFAULT_LOGIN_EXPIRATION_DAYS,
        //oauthSecretKey: null,  // server-only
        passwordResetTokenExpirationInDays: 3,
        passwordResetTokenExpiration: 3 * 24*3600*1000,
        passwordEnrollTokenExpirationInDays: 30,
        passwordEnrollTokenExpiration: 30 * 24*3600*1000,
        ambiguousErrorMessages: true,
        bcryptRounds: 10,
        argon2Enabled: false,
        argon2Type: 'argon2id',
        argon2TimeCost: 2,
        argon2MemoryCost: 19456,
        argon2Parallelism: 1,
        //defaultFieldSelector: // leave undefined as hardcoded defaults are not documented
        collection: 'users',
        loginTokenExpirationHours: 1,
        tokenSequenceLength: 6,
        clientStorage: 'session'
    },

    // the merged result of the below defaults and the specified options, 
    _config: {},

    /**
     * @getter
     * @param {String} option the name of the desired option
     * @returns {Any} the configured value for the specified key
     */
    get( option ){
        return AccountsConfig._config[option];
    }
};

AccountsConfig._config = _.merge( AccountsConfig._config, AccountsConfig._defaults, Accounts._options );
