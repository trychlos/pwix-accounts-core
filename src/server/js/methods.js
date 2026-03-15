/*
 * pwix:accounts-hub/src/server/js/methods.js
 */

import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

Meteor.methods({
    // find a user by one of his/her email addresses
    async 'pwix.AccountsHub.m.byEmailAddress'( instanceName, email, options ){
        try {
            return AccountsHub.s.byEmailAddress( instanceName, email, options );
        } catch( e ){
            logger.warning( 'pwix.AccountsHub.m.byEmailAddress()', e );
        }
    },

    // find a user by his internal (mongo) identifier
    async 'pwix.AccountsHub.m.byId'( instanceName, id, options ){
        try {
            return AccountsHub.s.byId( instanceName, id, options );
        } catch( e ){
            logger.warning( 'pwix.AccountsHub.m.byId()', e );
        }
    },

    // find a user by his/her username
    async 'pwix.AccountsHub.m.byUsername'( instanceName, username, options ){
        try {
            return AccountsHub.s.byUsername( instanceName, username, options );
        } catch( e ){
            logger.warning( 'pwix.AccountsHub.m.byUsername()', e );
        }
    }
});
