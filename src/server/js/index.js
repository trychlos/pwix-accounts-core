/*
 * pwix:accounts-core/src/server/js/index.js
 */

import '../../common/js/index.js';

import './check_npms.js';
import './functions.js';
import './methods.js';
import './publish.js';
import './users-accounts.js';

// on server side, the package is now fully evaluated, so ready
AccountsCore.ready( true );
