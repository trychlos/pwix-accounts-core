Package.describe({
    name: 'pwix:accounts-core',
    version: '2.2.1',
    summary: 'Accounts core management for Meteor',
    git: 'https://github.com/trychlos/pwix-accounts-core',
    documentation: 'README.md'
});

Package.onUse( function( api ){
    configure( api );
    api.export([
        'AccountsCore'
    ]);
    api.mainModule( 'src/client/js/index.js', 'client' );
    api.mainModule( 'src/server/js/index.js', 'server' );
});

Package.onTest( function( api ){
    configure( api );
    api.use( 'tinytest' );
    api.use( 'pwix:accounts-core' );
    api.mainModule( 'test/js/index.js' );
});

function configure( api ){
    api.versionsFrom([ '2.9.0', '3.0.1' ]);
    api.use( 'accounts-base' );
    api.use( 'blaze-html-templates@2.0.0 || 3.0.0-alpha300.0', 'client' );
    api.use( 'check' );
    api.use( 'ecmascript' );
    api.use( 'less@4.0.0', 'client' );
    api.use( 'mongo' );
    api.use( 'pwix:i18n@1.5.0' );
    api.use( 'pwix:logger@1.0.0-rc' );
    api.use( 'pwix:options@2.1.0' );
    api.use( 'random' );
    api.use( 'reactive-var' );
    api.use( 'tmeasday:check-npm-versions@1.0.2 || 2.0.0-beta.0', 'server' );
    api.addFiles( 'src/client/components/acPreferredLabel/acPreferredLabel.js', 'client' );
}

// NPM dependencies are checked in /src/server/js/check_npms.js
// See also https://guide.meteor.com/writing-atmosphere-packages.html#peer-npm-dependencies
