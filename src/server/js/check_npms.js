/*
 * pwix:accounts-hub/src/server/js/check_npms.js
 */

import { checkNpmVersions } from 'meteor/tmeasday:check-npm-versions';

if( false ){
    require( 'multiple-select-vanilla/package.json' );
}

checkNpmVersions({
    'email-validator': '^2.0.4',
    'lodash': '^4.17.0',
    'multiple-select-vanilla': '^5.1.0',
    'zxcvbn': '^4.4.2'
},
    'pwix:accounts-hub'
);
