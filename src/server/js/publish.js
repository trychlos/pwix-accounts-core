/*
 * pwix:accounts-hub/src/server/js/publish.js
 */

import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

// returns a cursor of all accounts in the named collection
Meteor.publish( 'pwix_accounts_hub_list_all', async function( instanceName ){
    const ahInstance = AccountsHub.getInstance( instanceName );
    const self = this;
    //logger.debug( 'subscribing to', instanceName );

    // @param {Object} item the Record item
    // @returns {Object} item the transformed item
    const f_transform = async function( item ){
        item.DYN = {};
        item.DYN.preferredLabel = await ahInstance.preferredLabel( item );
        const fn = ahInstance.serverAllExtend();
        if( fn ){
            await fn( instanceName, item, self.userId );
        }
        AccountsHub.s.addUndef( instanceName, item );
        return item;
    };

    if( ahInstance && ahInstance instanceof AccountsHub.ahClass ){
        //if( !await AccountsManager.isAllowed( 'pwix.accounts_hub.feat.list', self.userId, { ahInstance: ahInstance } )){
        //    return false;
        //}
        let initializing = true;

        const observer = ahInstance.collection().find().observeAsync({
            added: async function( item ){
                const transformed = await f_transform( item );
                self.added( ahInstance.collectionName(), item._id, transformed );
            },
            changed: async function( newItem, oldItem ){
                if( !initializing ){
                    const transformed = await f_transform( newItem );
                    self.changed( ahInstance.collectionName(), newItem._id, transformed );
                }
            },
            removed: async function( oldItem ){
                self.removed( ahInstance.collectionName(), oldItem._id );
            }
        });

        initializing = false;

        self.onStop( function(){
            //logger.debug( 'stopping', instanceName );
            observer.then(( handle ) => { handle.stop(); });
        });

        self.ready();

    } else {
        logger.warn( 'pwix_accounts_hub_list_all: unknown or invalid instance name', instanceName );
        return false;
    }
});
