import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { LoginPage } from '../pages/login/login';
import { CadastroPage } from '../pages/cadastro/cadastro';
import { InicioPage } from '../pages/inicio/inicio';
import { IonicStorageModule } from '@ionic/storage';
import { HttpModule } from '@angular/http';


@NgModule({
  declarations: [
    //Declaração de todas as páginas que estão sendo utilizadas no projeto
    MyApp,
    HomePage,
    LoginPage,
    CadastroPage,
    InicioPage
  ],
  imports: [
    //Imports necessários para o projeto
    HttpModule,
    BrowserModule,
    IonicStorageModule.forRoot(),
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    //Imports das páginas utilizadas
    MyApp,
    HomePage,
    LoginPage,
    CadastroPage,
    InicioPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
