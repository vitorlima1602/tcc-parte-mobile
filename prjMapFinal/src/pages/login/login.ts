//Imports utilizados
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import 'rxjs/add/operator/map';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { HomePage } from '../home/home';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

//Define o template que será utilizado
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  //Declaração das variáveis
  usuario = '';
  senha = '';
  arrayUsuario = [];

  //Método Construtor
  constructor(public navCtrl: NavController, private http: Http, private alertCtrl: AlertController, private storage: Storage) {

  }

  //Método para efetuar login
  Login() {

    //Cabeçalho da requisição
    var headers = new Headers();
    headers.append("Accept", 'application/json');
    headers.append('Content-Type', 'application/json');

    //instanciando uma variável do tipo RequestOption e passando como parâmetro a variavel headers
    let options = new RequestOptions({ headers: headers });


    //Parâmetros que são passados do formulário para efetuar login através de uma requisição
    let postParams = {
      login: this.usuario,
      senha: this.senha
    }

    //Request para efetuar login
    this.http.post("http://www.localhost:8000/api/postefetuarlogin", postParams, options).map((res: Response) => (res.json())).subscribe(data => {


      if (data.status == 'success') {

        //abre a interface Home passando o id e nome do usuario
        this.navCtrl.push(HomePage, { 'id': data.data.id, 'name': data.data.nomeusuario });

        //Se usuário ou senha inválidos, é disparado o método doAlertCredenciaisInvalidas()
      } else if (data.status == 'error') {
        console.log('error')
        this.doAlertCredenciaisInvalidas();
      }

    }, error => {

    });


  }

  //Método que mostra mensagem de credenciais inválidas 
  doAlertCredenciaisInvalidas() {
    let alert = this.alertCtrl.create({
      title: 'Credenciais inválidas',
      subTitle: 'Revise suas credenciais e tente novamente!',
      buttons: ['Entendi!']
    });

    alert.present();
  }

}
