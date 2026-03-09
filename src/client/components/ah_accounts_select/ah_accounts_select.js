/*
 * pwix:accounts-hub/src/client/components/ah_accounts_select/ah_accounts_select.js
 *
 * Select zero to n accounts.
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
import { multipleSelect } from 'multiple-select-vanilla';

import { Logger } from 'meteor/pwix:logger';
import { pwixI18n } from 'meteor/pwix:i18n';
import { UIUtils } from 'meteor/pwix:ui-utils';

import './ah_accounts_select.html';

const logger = Logger.get();

Template.ah_accounts_select.onCreated( function(){
    const self = this;
    //logger.debug( self );

    self.AH = {
        $select: null,
        ms: null,
        selectables: new ReactiveVar( [] ),
        selectedIds: new ReactiveVar( [] ),

        // send the selection on each selection change
        // selected: an array of selected identities ids
        // items: an array of selected identities
        triggerSelected( event, selected ){
            let items = [];
            selected.forEach(( it ) => {
                let found = false;
                self.AH.selectables.get().every(( account ) => {
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

    // track the selectables
    self.autorun(() => {
        self.AH.selectables.set( Template.currentData().selectable || [] );
    });
});

Template.ah_accounts_select.onRendered( function(){
    const self = this;

    // prepare the multipleSelect configuration
    const dataContext = Template.currentData();
    let conf = {
        selectAll: false,
        filter: true,
        classes: 'form-control',
        autoAdjustDropHeight: true,
        onClick( data ){
            const selected = self.AH.ms ? self.AH.ms.getSelects() : [];
            self.AH.triggerSelected.bind( self )( 'ah-selected', selected );
        }
    };

    // make sure that we have something before init the multipleSelect widget
    self.autorun(() => {
        const dataContext = Template.currentData();
        if( dataContext.selectOptions ){
            _.merge( conf, dataContext.options );
        }
        UIUtils.DOM.waitFor( '.ah-accounts-select select.multiple-select' )
            .then(() => {
                self.AH.$select = self.$( '.ah-accounts-select select.multiple-select' );
                conf.placeholder = dataContext.select_ph || pwixI18n.label( I18N, 'dialogs.accounts_select_ph' );
                self.AH.ms = multipleSelect( self.AH.$select, conf );
            }).then(() => {
                self.AH.ms.open();
            });
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
        return Template.instance().AH.selectables.get();
    },

    // whether the current item is selected
    itSelected( it ){
        return this.selected.get().includes( it._id ) ? 'selected' : '';
    }
});
