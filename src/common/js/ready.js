/*
 * pwix:accounts-hub/src/common/js/ready.js
 *
 * The package must be fully evaluated before instanciating any element.
 */

import { Logger } from 'meteor/pwix:logger';
import { Tracker } from 'meteor/tracker';

const logger = Logger.get();

_ready = {
    value: false,
    dep: new Tracker.Dependency()
};

/**
 * @locus Anywhere
 * @summary Set/Get the readyness status of the package
 *  the package is considered as 'ready' when it has finished to evaluate
 * @param {Boolean|none} b a status to be set when acting as a setter
 * @returns {Boolean} the current readyness status
 *  A reactive data source.
 */
AccountsHub.ready = function( b ){
    if( b !== undefined ){
        _ready.value = b;
        _ready.dep.changed();
    }
    _ready.dep.depend();
    return _ready.value;
}

Tracker.autorun(() => {
    logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.READY }, 'ready', AccountsHub.ready());
});
