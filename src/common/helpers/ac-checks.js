/*
 * pwix:accounts-core/src/common/helpers/ac-checks.js
 */

import _ from 'lodash';
import emailValidator from 'email-validator';
import zxcvbn from 'zxcvbn';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';
import { pwixI18n } from 'meteor/pwix:i18n';

const logger = Logger.get();

export const acChecks = {

    /**
     * @summary: check that the proposed candidate email address is valid, and not already exists
     */
    async checkEmailAddress( acInstance, email, opts={} ){
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
            //logger.debug( 'checkEmailAddress()', result );
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
            //logger.debug( 'checkEmailAddress()', result );
            return result;
        }
        // check if the email address already exists
        const _checkExists = async function(){
            if( opts.testExists !== false ){
                if( Boolean( await acInstance.byEmailAddress( result.canonical ))){
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
        //logger.debug( 'checkEmailAddress()', result );
        return result;
    },

    /**
     * @summary: check that the proposed candidate password is valid
     */
    async checkPassword( acInstance, password, opts={} ){
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
        result.minScore = this.checkPasswordComputeMinScore( acInstance );
        result.zxcvbn = zxcvbn( result.canonical );
        // check if the password is set
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
                const minLength = acInstance.opts().passwordLength();
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
    },

    // let the configured password strength be converted into a zxcvbn score
    _scores: [
        AccountsCore.C.Password.VERYWEAK,
        AccountsCore.C.Password.WEAK,
        AccountsCore.C.Password.MEDIUM,
        AccountsCore.C.Password.STRONG,
        AccountsCore.C.Password.VERYSTRONG
    ],

    checkPasswordComputeMinScore( acInstance ){
        const strength = acInstance.opts().passwordStrength();
        let minScore = -1;
        for( let i=0 ; i<acChecks._scores.length && minScore === -1 ; ++i ){
            if( this._scores[i] === strength ){
                minScore = i;
            }
        }
        return minScore;
    },

    /**
     * @summary: check that the proposed candidate username is valid, and not already exists
     */
    async checkUsername( acInstance, username, opts={} ){
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
                const minLength = acInstance.opts().usernameLength();
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
                if( Boolean( await acInstance.byUsername( result.canonical ))){
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
};
