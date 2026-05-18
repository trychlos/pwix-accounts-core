/*
 * /imports/client/components/acPreferredLabel/acPreferredLabel.js
 *
 * A component which asynchronously display the preferred label for the provided user id.
 * 
 * Parms:
 * - acName: the name of the acAccount instance we are referring to, defaulting to 'users'
 * - acUserId: the user identifer whose preferred label is to be displayed
 *   or
 * - acUserLabel: the label to be displayed
 *   when set, the label is preferentially taken over the user id
 */

import { AccountsCore } from 'meteor/pwix:accounts-core';
import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

import './acPreferredLabel.html';

const logger = Logger.get();

Template.acPreferredLabel.onCreated( function(){
    const self = this;

    self.APP = {
        preferredLabel: new ReactiveVar( null ),
        // warn only once when a userId is not found
        warned: {}
    };

    // get the preferred label
    self.autorun(() => {
        const label = Template.currentData().acUserLabel;
        if( label ){
            self.APP.preferredLabel.set( label );
        } else {
            const userId = Template.currentData().acUserId;
            if( userId ){
                const instanceName = Template.currentData().acName || AccountsCore.Options._defaults.name;
                check( instanceName, Match.NonEmptyString );
                const acInstance = AccountsCore.getInstance( instanceName );
                check( acInstance, AccountsCore.Account );
                acInstance.preferredLabel( userId ).then(( res ) => {
                    if( res ){
                        self.APP.preferredLabel.set( res.label );
                    } else {
                        if( AccountsCore.configure().preferredLabelWarnsOnce ){
                            AccountsCore._preferredLabelWarned = AccountsCore._preferredLabelWarned || {};
                            if( !AccountsCore._preferredLabelWarned[userId] ){
                                logger.warning( 'userId not found', userId );
                                AccountsCore._preferredLabelWarned[userId] = true;
                            }
                        } else {
                            logger.warning( 'userId not found', userId );
                        }
                    }
                });
            }
        }
    });
});

Template.acPreferredLabel.helpers({
    // display the preferred label
    preferredLabel(){
        return Template.instance().APP.preferredLabel.get();
    }
});
