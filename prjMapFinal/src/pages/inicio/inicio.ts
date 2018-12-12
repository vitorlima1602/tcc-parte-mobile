import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { LoginPage } from '../login/login';
import { CadastroPage } from '../cadastro/cadastro';

@Component({
  selector: 'page-inicio',
  templateUrl: 'inicio.html'
})

export class InicioPage {

    constructor(public navCtrl: NavController) { 
        
          }

          Login(){
            this.navCtrl.push(LoginPage);
          }

          Cadastro(){
            this.navCtrl.push(CadastroPage);
          }

}