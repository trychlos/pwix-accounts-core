/*
 * pwix:accounts-hub/src/server/js/methods.js
 */

import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

Meteor.methods({
    // find a user by one of his/her email addresses
    async 'AccountsHub.byEmailAddress'( instanceName, email, options ){
        try {
            return AccountsHub.s.byEmailAddress( instanceName, email, options );
        } catch( e ){
            logger.warning( 'AccountsHub.byEmailAddress()', e );
        }
    },

    // find a user by his internal (mongo) identifier
    async 'AccountsHub.byId'( instanceName, id, options ){
        try {
            return AccountsHub.s.byId( instanceName, id, options );
        } catch( e ){
            logger.warning( 'AccountsHub.byId()', e );
        }
    },

    // find a user by his/her username
    async 'AccountsHub.byUsername'( instanceName, username, options ){
        try {
            return AccountsHub.s.byUsername( instanceName, username, options );
        } catch( e ){
            logger.warning( 'AccountsHub.byUsername()', e );
        }
    }
});
