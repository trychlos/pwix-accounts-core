/*
 * pwix:accounts-core/src/client/components/ac_accounts_select/ac_accounts_select.js
 *
 * Select zero to n accounts.
 * 
 * Parms:
 * - selectables: a list of user documents to be selected among
 * - selected: a ReactiveVar which contains the array of initially selected accounts ids
 * - disabled: whether this component should be disabled, defaulting to false
 * - selectOptions: additional configuration options for multiple-select component
 * - select_ph: the select component placeholder, defaulting to (localized) 'Select the desired accounts'
 * 
 * Events:
 * - ah-selected: the new selected items, re-triggered each time the selection changes, with data:
 *   > selected: an array of selected accounts ids
 *   > items: an array of selected accounts items
 */

import _ from 'lodash';

import { Logger } from 'meteor/pwix:logger';
import { pwixI18n } from 'meteor/pwix:i18n';

import './ac_accounts_select.html';

const logger = Logger.get();

Template.ac_accounts_select.onCreated( function(){
    const self = this;
    //logger.debug( self );

    self.AH = {
        $select: null,
        selectedIds: new ReactiveVar( [] ),

        // send the selection on each selection change
        // selected: an array of selected identities ids
        triggerSelected( id, checked ){
            let selected = self.AH.selectedIds.get();
            if( checked ){
                if( !selected.includes( id )){
                    selected.push( id );
                }
            } else {
                if( selected.includes( id )){
                    selected = selected.filter(( ident ) => { return ident !== id; });
                }
            }
            self.$( '.ac-accounts-select' ).trigger( 'ah-selected', { selected });
            self.AH.selectedIds.set( selected );
        }
    };
});

Template.ac_accounts_select.helpers({
    // whether the component should be disabled
    isDisabled(){
        return this.disabled === true ? 'disabled' : '';
    },

    // the relation between the label and the checkbox
    itFor( it ){
        return it._id;
    },

    // return the item identifier
    itId( it ){
        return it._id;
    },

    // return the item label
    itLabel( it ){
        return it.DYN.preferredLabel.label;
    },

    // return the list of selectables accounts
    itemsList(){
        return this.selectables;
    },

    // whether the current item is selected
    itSelected( it ){
        return this.selected.get().includes( it._id ) ? 'selected' : '';
    }
});

Template.ac_accounts_select.events({
    'click .form-check'( event, instance ){
        const $checkbox = instance.$( event.currentTarget ).find( '.form-check-input' );
        const checked = instance.$( event.currentTarget ).find( '.form-check-input' ).prop( 'checked' );
        instance.AH.triggerSelected( $checkbox.val(), checked );
    }
});
