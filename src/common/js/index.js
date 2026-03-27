/*
 * pwix:accounts-core/src/common/js/index.js
 */

import './global.js';
import './constants.js';

import { acAccount } from '../classes/ac-account.class';
import { acOptions } from '../classes/ac-options.class';

import { acChecks } from '../helpers/ac-checks';
import { acTransforms } from '../helpers/ac-transforms';

import './configure.js';
import './functions.js';
import './i18n.js';
import './ready.js';
import './startup.js';

AccountsCore.acAccount = acAccount;
AccountsCore.Options = acOptions;
AccountsCore.Checks = acChecks;
AccountsCore.Transforms = acTransforms;
