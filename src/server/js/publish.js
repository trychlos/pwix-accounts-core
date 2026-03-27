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
    check( acInstance, Match.OneOf( null, AccountsCore.acAccount ));
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

    // @param {Object} item the Record item
    // @returns {Object} item the transformed item
    const f_transform = async function( item ){
        const transforms = acInstance.transformsPublish( AccountsCore.C.pub.listAll.name );
        for( const fn of ( transforms || [] )){
            item = await fn( acInstance, item, opts, self.userId );
        }
        return item;
    };

    let initializing = true;

    const observer = acInstance.collection().find().observeAsync({
        added: async function( item ){
            const transformed = await f_transform( item );
            self.added( acInstance.opts().collection(), item._id, transformed );
        },
        changed: async function( newItem, oldItem ){
            if( !initializing ){
                const transformed = await f_transform( newItem );
                self.changed( acInstance.opts().collection(), newItem._id, transformed );
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
