/*
 * pwix:accounts-core/src/server/js/publish.js
 */

import _ from 'lodash';

import { check, Match } from 'meteor/check';
import { Logger } from 'meteor/pwix:logger';

const logger = Logger.get();

// returns a cursor of all accounts in the named collection
Meteor.publish( AccountsCore.C.pub.listAll.name, async function( instanceName, opts={} ){
    const self = this;
    check( instanceName, Match.NonEmptyString );
    const acInstance = AccountsCore.getInstance( instanceName );
    check( acInstance, Match.OneOf( null, AccountsCore.Account ));
    if( !acInstance ){
        logger.warning( AccountsCore.C.pub.listAll.name, 'unable to find an acAccount instance for name=\''+instanceName+'\'' );
        self.ready();
        return false;
    }
    // is the user allowed to list accounts ?
    if( !await AccountsCore.isAllowed( AccountsCore.C.pub.listAll.permission, self.userId, { instance: acInstance } )){
        self.ready();
        return false;
    }

    let initializing = true;

    const observer = acInstance.collection().find().observeAsync({
        added: async function( item ){
            const transformed = await AccountsCore.s.applyPublishTransforms( AccountsCore.C.pub.listAll.name, acInstance, item, opts, self.userId );
            //if( item._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'added transformed', transformed );
            self.added( acInstance.opts().collection(), item._id, transformed );
        },
        changed: async function( newItem, oldItem ){
            if( !initializing ){
                const transformed = await AccountsCore.s.applyPublishTransforms( AccountsCore.C.pub.listAll.name, acInstance, newItem, opts, self.userId );
                //if( newItem._id === 'KkpHFA8JcL8hWi6Cn' ) logger.debug( 'changed transformed', transformed );
                try {
                    self.changed( acInstance.opts().collection(), newItem._id, transformed );
                } catch( e ){
                    // ignore
                }
            }
        },
        removed: async function( oldItem ){
            self.removed( acInstance.opts().collection(), oldItem._id );
        }
    });

    initializing = false;

    self.onStop( function(){
        //logger.debug( 'stopping', instanceName );
        observer.then(( handle ) => { handle.stop(); });
    });

    self.ready();
    //logger.debug( 'publication ready', instanceName, Date.now());
});
