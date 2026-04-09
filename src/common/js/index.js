/*
 * pwix:accounts-core/src/common/js/index.js
 */

import './global.js';
import './constants.js';

import { acAccount } from '../classes/ac-account.class';
import { acOptions } from '../classes/ac-options.class';

import { AccountsConfig } from '../helpers/accounts-config';
import { acChecks } from '../helpers/ac-checks';

import './configure.js';
import './functions.js';
import './i18n.js';
import './ready.js';
import './startup.js';

AccountsCore.Account = acAccount;
AccountsCore.Checks = acChecks;
AccountsCore.Config = AccountsConfig;
AccountsCore.Options = acOptions;
