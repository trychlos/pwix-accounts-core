/*
 * pwix:accounts-hub/src/client/js/functions.js
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { Modal } from 'meteor/pwix:modal';
import { ReactiveVar } from 'meteor/reactive-var';

import '../components/ah_select_dialog/ah_select_dialog.js';

const logger = Logger.get();

/**
 * @locus Client
 * @summary Run a modal dialog to let the user select user accounts (from 'users' collection)
 *  NB: this function returns immediately without any (valuable) value.
 *  The caller can get the result from the updates done in the passed-in ReactiveVar
 *  or react to the 'ah-select-accounts' event.
 * @param {ReactiveVar} selected an array of selected ids
 * @param {Object} opts an optional options object with following keys:
 *  - disabled: whether the selection component should be disabled, defaulting to false
 *  - selectOptions: additional configuration options for (multiple-select) selection component
 *  - instance: the name of the accounts instance, defaulting to 'users'
 *  - select_ph: the select component placeholder, defaulting to (localized) 'Select the desired accounts'
 *  - dialog_title: the dialog title, defaulting to (localized) 'Select one or more user accounts'
 *  - $target: a jQuery object which will receive the 'ah-accounts-select' event at the validation of the dialog
 */
AccountsHub.runAccountsSelection = function( selected, opts={} ){
    logger.verbose({ verbosity: AccountsHub.configure().verbosity, against: AccountsHub.C.Verbose.FUNCTIONS }, 'runAccountsSelection()', arguments );
    if( Meteor.isClient && selected && selected instanceof ReactiveVar ){
        Modal.run({
            selected: selected,
            disabled: opts.disabled === true,
            selectOptions: opts.selectOptions,
            instance: opts.instance || 'users',
            select_ph: opts.select_ph,
            dialog_title: opts.dialog_title,
            $target: opts.$target,
            mdBody: 'ah_select_dialog',
            mdButtons: [ Modal.C.Button.CANCEL, Modal.C.Button.OK ],
            mdClasses: 'modal-lg',
            mdTitle: opts.dialog_title || pwixI18n.label( I18N, 'dialogs.accounts_select_dialog_title' )
        });
    } else {
        logger.error( 'expects \'selected\' be an instance of \'ReactiveVar\', got', selected, 'throwing...' );
        throw new Error( 'Bad argument: selected' );
    }
};
