/*
 * /imports/client/components/ahPreferredLabel/ahPreferredLabel.js
 *
 * A component which asynchronously display the preferred label for the provided user id.
 * 
 * Parms:
 * - ahName: the name of the ahClass instance we are referring to, defaulting to 'users'
 * - ahUserId: the user identifer whose preferred label is to be displayed
 *   or
 * - ahUserLabel: the label to be displayed
 *   when set, the label is preferentially taken over the user id
 */

const assert = require( 'assert' ).strict;

import { AccountsHub } from 'meteor/pwix:accounts-hub';

import './ahPreferredLabel.html';

Template.ahPreferredLabel.onCreated( function(){
    const self = this;

    self.APP = {
        preferredLabel: new ReactiveVar( null )
    };

    // get the preferred label
    self.autorun(() => {
        const label = Template.currentData().ahUserLabel;
        if( label ){
            self.APP.preferredLabel.set( label );
        } else {
            const userId = Template.currentData().ahUserId;
            if( userId ){
                const name = Template.currentData().ahName || AccountsHub.ahOptions._defaults.name;
                if( name ){
                    const ahInstance = AccountsHub.getInstance( name );
                    assert( ahInstance && ahInstance instanceof AccountsHub.ahClass, 'expects an instance of AccountsHub.ahClass, got '+ahInstance );
                    ahInstance.preferredLabel( userId ).then(( res ) => {
                        self.APP.preferredLabel.set( res.label );
                    });
                }
            }
        }
    });
});

Template.ahPreferredLabel.helpers({
    // display the preferred label
    preferredLabel(){
        return Template.instance().APP.preferredLabel.get();
    }
});
