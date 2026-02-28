/*
 * pwix:accounts-hub/src/client/components/ah_accounts_select/ah_accounts_select.js
 *
 * Select zero to n identities.
 * 
 * Parms:
 * - selectable: a list of user documents to be selected among
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
import 'multiple-select';
import 'multiple-select/dist/multiple-select.min.css';

import { pwixI18n } from 'meteor/pwix:i18n';
import { UIUtils } from 'meteor/pwix:ui-utils';

import './ah_accounts_select.html';

Template.ah_accounts_select.onCreated( function(){
    const self = this;

    self.AH = {
        $select: null,
        selectedIds: new ReactiveVar( [] ),

        // send the selection on each selection change
        // selected: an array of selected identities ids
        // items: an array of selected identities
        triggerSelected( event, selected, dc ){
            let items = [];
            selected.forEach(( it ) => {
                let found = false;
                dc.selectable.every(( account ) => {
                    if( account._id === it ){
                        found = true;
                        items.push( account );
                    }
                    return !found;
                });
            });
            self.AH.$select.trigger( event, { selected: selected, items: items });
        }
    };
});

Template.ah_accounts_select.onRendered( function(){
    const self = this;

    self.AH.$select = self.$( '.ah-accounts-select select.multiple-select' );

    // have the data context
    let dc;
    self.autorun(() => {
        dc = Template.currentData();
    });

    // prepare the multipleSelect configuration
    let conf = {
        selectAll: false,
        filter: true,
        classes: 'form-control',
        maxHeight: 540,
        onClick( data ){
            self.AH.triggerSelected( 'ah-selected', self.AH.$select.multipleSelect( 'getSelects' ), dc );
        }
    };
    if( Template.currentData().selectOptions ){
        _.merge( conf, Template.currentData().options );
    }

    // make sure that we have something before init the multipleSelect widget
    self.autorun(() => {
        const selectable = Template.currentData().selectable;
        if( selectable ){
            UIUtils.DOM.waitFor( '.ah-accounts-select select.multiple-select' ).then(() => {
                conf.placeholder = dc.select_ph || pwixI18n.label( I18N, 'dialogs.accounts_select_ph' );
                self.AH.$select.multipleSelect( conf );
            }).then(() => {
                self.AH.$select.multipleSelect( 'open' );
            });
        }
    });
});

Template.ah_accounts_select.helpers({
    // whether the component should be disabled
    isDisabled(){
        return this.disabled === true ? 'disabled' : '';
    },

    // return the item identifier
    itId( it ){
        return it._id;
    },

    // return the item label
    itLabel( it ){
        return it.DYN.preferredLabel.label;
    },

    // return the list of selectable accounts
    itemsList(){
        return this.selectable;
    },

    // whether the current item is selected
    itSelected( it ){
        return this.selected.get().includes( it._id ) ? 'selected' : '';
    }
});
