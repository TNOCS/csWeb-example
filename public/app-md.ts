module App {


    export interface IAppScope extends ng.IScope {
        vm: AppCtrl;
        title: string;
        showMenuLeft: boolean;
        showMenuRight: boolean;
        featureSelected: boolean;
        layersLoading: number;
        project: any;
        theme: any;
        changeTheme: Function;
    }



    export class AppCtrl {
        // It provides $injector with information about dependencies to be injected into constructor
        // it is better to have it close to the constructor, because the parameters must match in count and type.
        // See http://docs.angularjs.org/guide/di
        static $inject = [
            '$scope', '$mdSidenav', '$mdToast'
        ]; 

        
        // dependencies are injected via AngularJS $injector
        // controller's name is registered in Application.ts and specified from ng-controller attribute in index.html
        constructor(
            public $scope: IAppScope,
            public $mdSidenav: any,
            public $mdToast: any

        ) {

            $scope.vm = this;
            $scope.showMenuRight = false;
            $scope.featureSelected = false;
            $scope.layersLoading = 0;
            $scope.project = { title: "Common Sense" };



            $scope.theme = 'lime';
            $scope.changeTheme = function() {
                $scope.theme = $scope.theme === 'indigo' ? 'lime' : 'indigo';
            };

        }



      



        public test() {            
            //console.log(this.$mdSidenav);
            // this.$mdToast.show(
            //     this.$mdToast.simple()
            //         .textContent('Simple Toast!')
            //         .position(this.$scope.getToastPosition())
            //         .hideDelay(3000)
            // );


        }

    }  

    // Start the application
    angular.module('csWebApp', [
        'ngMaterial', 'ngHamburger', 'ngMdIcons', 'csComp',
    ]).config(function($mdThemingProvider) {


        $mdThemingProvider.theme('lime')
            .primaryPalette('lime')
            .accentPalette('orange')
            .warnPalette('blue');

        $mdThemingProvider.theme('indigo')
            .primaryPalette('indigo')
            .accentPalette('pink');
    
        // This is the absolutely vital part, without this, changes will not cascade down through the DOM.
        $mdThemingProvider.alwaysWatchTheme(true);
    }).

        config(function($mdIconProvider) {
            $mdIconProvider
                .iconSet("call", 'img/icons/sets/communication-icons.svg', 24)
                .iconSet("social", 'img/icons/sets/social-icons.svg', 24);
        })
        .controller('appCtrl', AppCtrl);

}
