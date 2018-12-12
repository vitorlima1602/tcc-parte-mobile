//Imports utilizados
import { Component } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { NavController } from 'ionic-angular';
import { Http, Headers, RequestOptions, Response } from '@angular/http';
import { AlertController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from '../home/home';

//Define o template que será utilizado
@Component({
  selector: 'page-cadastro',
  templateUrl: 'cadastro.html'
})

export class CadastroPage {

  //Declaração das variáveis
  nomeUsuario = '';
  primNome = '';
  ultNome = '';
  senha = '';
  email = '';
  logradouro = '';
  numero = '';
  bairro = '';
  cidade = '';
  cadastrar: any = {};

  //Método Construtor
  constructor(public navCtrl: NavController, private http: Http, private alertCtrl: AlertController, public formBuilder: FormBuilder, private storage: Storage) {
    //Validador para os campos do formulário  
    this.cadastrar = this.formBuilder.group({
      nomeUsuario: ['', Validators.required],
      primNome: ['', Validators.required],
      ultNome: ['', Validators.required],
      senha: ['', Validators.required],
      email: ['', Validators.required],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required]
    });

  }

  //Método responsável pelo cadastro do cidadão
  CadastroCidadao() {

    //Cabeçalho da requisição
    var headers = new Headers();
    headers.append("Accept", 'application/json');
    headers.append('Content-Type', 'application/json');

    //instanciando uma variável do tipo RequestOption e passando como parâmetro a variavel headers
    let options = new RequestOptions({ headers: headers });


    //Parâmetros que são passados do formulário para serem validados no banco de dados através de uma requisição
    let postParams1 = {
      nomeusuario: this.nomeUsuario,
    }

    //Request para validar se já existe um usuário com o mesmo nome passado
    this.http.post("http://www.localhost:8000/api/postvalidausuario", postParams1, options).map((res: Response) => (res.json())).subscribe(data => {

      //Se já existe um usuario com o nome passado, é disparado o método doAlertValidaUsuario()   
      if (data.status == 'success') {

        this.doAlertValidaUsuario();

        //Se não existir o usuário passado, será feito o cadastro
      } else if (data.status == 'error') {

        //Parâmetros que são passados do formulário para serem salvos no banco de dados através de uma requisição
        let postParams2 = {

          nomeUsuario: this.nomeUsuario,
          primNome: this.primNome,
          ultNome: this.ultNome,
          senha: this.senha,
          email: this.email,
          logradouro: this.logradouro,
          numero: this.numero,
          bairro: this.bairro,
          cidade: this.cidade
        }



        //REQUEST PARA SALVAR DADOS NO BANCO
        this.http.post("http://www.localhost:8000/api/postcadastros", postParams2).subscribe((res: Response) => {

          //Dispara o método doAlertSucesso()
          this.doAlertSucesso();

        });

        //Parâmetros que são passados do formulário para efetuar login através de uma requisição
        let postParams3 = {
          login: this.nomeUsuario,
          senha: this.senha
        }

        //Request para efetuar login
        this.http.post("http://www.localhost:8000/api/postefetuarlogin", postParams3, options).map((res: Response) => (res.json())).subscribe(data => {

          if (data.status == 'success') {

            //abre a interface Home passando o id e nome do usuario
            this.navCtrl.push(HomePage, { 'id': data.data.id, 'name': data.data.nomeusuario });

          }

        }, error => {

        });
      }

    }, error => {

    });
  }

  //Método que mostra a mensagem que já existe um usuário com o nome passado
  doAlertValidaUsuario() {
    let alert = this.alertCtrl.create({
      title: 'Usuário já existente',
      subTitle: 'Utilize outro nome de usuário!',
      buttons: ['Entendi!']
    });

    alert.present();
  }

  //Método que mostra mensagem de sucesso quando o cadastro é realizado 
  doAlertSucesso() {

    let alert = this.alertCtrl.create({
      title: 'Dados salvos com sucesso!',
      buttons: ['OK!']
    });

    alert.present();

  }
}
