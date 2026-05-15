/*
 * pwix:accounts-core/src/client/components/ac_select_dialog/ac_select_dialog.js
 *
 * Select zero to n user accounts.
 * Applies to the Meteor standard 'users' collection.
 * 
 * Parms:
 * - selected: a ReactiveVar which contains the array of selected user accounts ids
 * - disabled: whether this component should be disabled, defaulting to false
 * - selectOptions: additional configuration options for multiple-select component
 * - instance, the name of the accounts instance, defaulting to 'users'
 * - select_ph: the select component placeholder, defaulting to (localized) 'Select the desired accounts'
 * - $target: a jQuery object which will receive the 'ac-accounts-select' event at the end of the dialog
 * 
 * Events:
 *  - ah-select-accounts: sent on dialog validation
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { Modal } from 'meteor/pwix:modal';
import { ReactiveVar } from 'meteor/reactive-var';

import '../ac_accounts_select/ac_accounts_select.js';

import './ac_select_dialog.html';

const logger = Logger.get();

Template.ac_select_dialog.onCreated( function(){
    const self = this;
    //logger.debug( this );

    self.AH = {
        isModal: new ReactiveVar( false ),
        // the last received selection
        lastSelected: null,
        // the to-be-edited selection, aka a deep copy of the input parameter
        selected: new ReactiveVar( null ),
        // subscription handle
        handle: new ReactiveVar( null ),
        // the list of accounts among which the selection is made
        selectables: new ReactiveVar( null )
    };

    // get a deep copy to-be-edited of the initial selection
    self.autorun(() => {
        self.AH.selected.set( _.cloneDeep( Template.currentData().selected.get()));
    });

    // subscribe to the accounts collection
    self.autorun(() => {
        const name = Template.currentData().instance || 'users';
        const acInstance = AccountsCore.getInstance( name );
        if( acInstance ){
            self.AH.handle.set( self.subscribe( 'pwix.AccountsCore.p.listAll', name ));
        } else {
            logger.warn( 'unknown AccountsCore.Account instance', name );
        }
    });

    // get and sort all the accounts
    self.autorun(() => {
        const handle = self.AH.handle.get();
        if( handle && handle.ready()){
            const name = Template.currentData().instance || 'users';
            const acInstance = AccountsCore.getInstance( name );
            if( acInstance ){
                const cmp = function( a, b ){
                    return a.DYN.preferredLabel.label > b.DYN.preferredLabel.label ? 1 : ( a.DYN.preferredLabel.label < b.DYN.preferredLabel.label ? -1 : 0 );
                };
                acInstance.collection().find().fetchAsync().then(( fetched ) => {
                    self.AH.selectables.set( fetched.sort( cmp ));
                });
            }
        }
    });

    // initialize the last selected value
    //  if the user just validates the dialog without having changed anything, this same-than-initial value will be considered
    self.autorun(() => {
        const selected = Template.currentData().selected.get();
        self.AH.lastSelected = { selected: selected };
    });
});

Template.ac_select_dialog.onRendered( function(){
    const self = this;

    // whether we are running inside of a Modal
    self.autorun(() => {
        self.AH.isModal.set( self.$( '.ac-select-dialog' ).parent().hasClass( 'modal-body' ));
    });

    // set the modal target
    self.autorun(() => {
        if( self.AH.isModal.get()){
            Modal.topmost().set({
                target: self.$( '.ac-select-dialog' )
            });
        }
    });
});

Template.ac_select_dialog.helpers({
    // parms for the ah_select component
    parmsSelect(){
        return {
            selectables: Template.instance().AH.selectables.get(),
            selected: Template.instance().AH.selected,
            disabled: this.disabled,
            selectOptions: this.selectOptions,
            select_ph: this.select_ph
        };
    }
});

Template.ac_select_dialog.events({
    // new identities selection
    'ah-selected .ac-select-dialog'( event, instance, data ){
        instance.AH.lastSelected = data;
    },

    // submit
    //  event triggered in case of a modal
    'md-click .ac-select-dialog'( event, instance, data ){
        //logger.debug( event, data );
        if( data.button.id === Modal.C.Button.OK ){
            instance.$( event.currentTarget ).trigger( 'iz-submit' );
        }
    },

    // submit
    // just close
    'iz-submit .ac-select-dialog'( event, instance ){
        const closeFn = function(){
            if( instance.AH.isModal.get()){
                Modal.topmost().close();
            }
        }
        // set the reactive var
        this.selected.set( instance.AH.lastSelected.selected );
        // trigger the event
        const $target = this.$target;
        if( $target ){
            $target.trigger( 'ac-accounts-select', instance.AH.lastSelected );
        }
        closeFn();
    }
});
