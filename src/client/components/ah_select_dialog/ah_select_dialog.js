/*
 * pwix:accounts-hub/src/client/components/ah_select_dialog/ah_select_dialog.js
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
 * - $target: a jQuery object which will receive the 'ah-accounts-select' event at the end of the dialog
 * 
 * Events:
 *  - ah-select-accounts: sent on dialog validation
 */

import _ from 'lodash';
import { strict as assert } from 'node:assert';

import { Modal } from 'meteor/pwix:modal';
import { ReactiveVar } from 'meteor/reactive-var';

import '../ah_accounts_select/ah_accounts_select.js';

import './ah_select_dialog.html';

Template.ah_select_dialog.onCreated( function(){
    const self = this;
    //console.debug( this );

    self.AH = {
        isModal: new ReactiveVar( false ),
        // the last received selection
        lastSelected: null,
        // the to-be-edited selection, aka a deep copy of the input parameter
        selected: new ReactiveVar( null ),
        // subscription handle
        handle: new ReactiveVar( null ),
        // the list of accounts among which the selection is made
        selectable: new ReactiveVar( null )
    };

    // get a deep copy to-be-edited of the initial selection
    self.autorun(() => {
        self.AH.selected.set( _.cloneDeep( Template.currentData().selected.get()));
    });

    // subscribe to the accounts collection
    self.autorun(() => {
        const name = Template.currentData().instance || 'users';
        const ahInstance = AccountsHub.getInstance( name );
        if( ahInstance ){
            self.AH.handle.set( self.subscribe( 'pwix_accounts_hub_list_all', name ));
        } else {
            console.warn( 'unknown AccountsHub.ahClass instance', name );
        }
    });

    // get and sort all the accounts
    self.autorun(() => {
        const handle = self.AH.handle.get();
        if( handle && handle.ready()){
            const name = Template.currentData().instance || 'users';
            const ahInstance = AccountsHub.getInstance( name );
            if( ahInstance ){
                const cmp = function( a, b ){
                    return a.DYN.preferredLabel.label > b.DYN.preferredLabel.label ? 1 : ( a.DYN.preferredLabel.label < b.DYN.preferredLabel.label ? -1 : 0 );
                };
                ahInstance.collection().find().fetchAsync().then(( fetched ) => {
                    self.AH.selectable.set( fetched.sort( cmp ));
                });
            }
        }
    });

    // initialize the last selected value
    //  if the user just validates the dialog without having changed anything, this same-than-initial value will be considered
    self.autorun(() => {
        const selectable = self.AH.selectable.get();
        const selected = Template.currentData().selected.get();
        let items = [];
        ( selectable || [] ).forEach(( it ) => {
            if( selected.includes( it._id )){
                items.push( it );
            }
        });
        //console.debug( 'selectable', selectable, 'selected', selected, 'items', items );
        self.AH.lastSelected = { items: items, selected: selected };
    });
});

Template.ah_select_dialog.onRendered( function(){
    const self = this;

    // whether we are running inside of a Modal
    self.autorun(() => {
        self.AH.isModal.set( self.$( '.ah-select-dialog' ).parent().hasClass( 'modal-body' ));
    });

    // set the modal target
    self.autorun(() => {
        if( self.AH.isModal.get()){
            Modal.set({
                target: self.$( '.ah-select-dialog' )
            });
        }
    });
});

Template.ah_select_dialog.helpers({
    // parms for the ah_select component
    parmsSelect(){
        return {
            selectable: Template.instance().AH.selectable.get(),
            selected: Template.instance().AH.selected,
            disabled: this.disabled,
            selectOptions: this.selectOptions,
            select_ph: this.select_ph
        };
    }
});

Template.ah_select_dialog.events({
    // new identities selection
    'ah-selected .ah-select-dialog'( event, instance, data ){
        instance.AH.lastSelected = data;
    },

    // submit
    //  event triggered in case of a modal
    'md-click .ah-select-dialog'( event, instance, data ){
        //console.debug( event, data );
        if( data.button.id === Modal.C.Button.OK ){
            instance.$( event.currentTarget ).trigger( 'iz-submit' );
        }
    },

    // submit
    // just close
    'iz-submit .ah-select-dialog'( event, instance ){
        const closeFn = function(){
            if( instance.AH.isModal.get()){
                Modal.close();
            }
        }
        // set the reactive var
        this.selected.set( instance.AH.lastSelected.selected );
        // trigger the event
        const $target = this.$target;
        if( $target ){
            $target.trigger( 'ah-accounts-select', instance.AH.lastSelected );
        }
        closeFn();
    }
});
