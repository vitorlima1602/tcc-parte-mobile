//Imports utilizados
import { Component } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { NavController, NavParams } from 'ionic-angular';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Storage } from '@ionic/storage';
import { InicioPage } from '../inicio/inicio';
import { AlertController } from 'ionic-angular';
import L from "leaflet";
import 'rxjs/add/operator/map';

//Define o template que será utilizado
@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})


export class HomePage {

    //Declaração das variáveis
    arrayAreasDoBD = [];
    areaSelecionada = '';
    arrayResposta = [];
    arraySubAreasJSON = [];
    subAreaSelecionada = '';
    dataReg = '';
    descricao = '';
    arrayRegistrosDoBD = [];
    registrar: any = {};
    registro: boolean;
    visaoProblemas: boolean;
    resposta: boolean;
    nomeCidadao = '';
    idCidadao = '';
    estadoComponentes = '';

    static mapaPrin: L.Map;
    static latSelecionada = '';
    static longSelecionada = '';
    static marcador: L.marker;
    static formAtivo: boolean;
    static problemas: L.GeoJSON;

    labelProblemas = 'Ver Problemas';
    labelFormulario = 'Registrar';

    //Método Construtor
    constructor(private storage: Storage, public navCtrl: NavController, private alertCtrl: AlertController, private http: Http, public navParams: NavParams, public formBuilder: FormBuilder) {
        //Setando id e nome de usuario no storage para utilizar na sessão
        this.storage.set("id", navParams.get('id'));
        this.storage.set("nome", navParams.get('name'));

        HomePage.formAtivo = false;

        //Validador para os campos do formulário  
        this.registrar = this.formBuilder.group({
            areaSelecionada: ['', Validators.required],
            subAreaSelecionada: ['', Validators.required],
            dataReg: ['', Validators.required],
            descricao: ['', Validators.required]
        });

        if (this.idCidadao == null && this.nomeCidadao == null) {
            this.storage.get('nome').then((nome) => {
                this.nomeCidadao = nome;
            });

            this.storage.get('id').then((id) => {
                this.idCidadao = id;
            });

        } else {
            this.nomeCidadao = navParams.get('name');

            this.idCidadao = navParams.get('id');
        }


        //Cabeçalho da requisição
        var headers = new Headers();
        headers.append("Accept", 'application/json');
        headers.append('Content-Type', 'application/json');

        //Request para carregar as areas do banco de dados
        this.http.get("http://www.localhost:8000/api/getareas").subscribe((res: Response) => {
            //Atribuindo JSON a variável
            var json = res.json();

            console.log(json.count[0].count)

            if (json.status == "success") {
                for (let i = 0; i < json.count[0].count; i++) {
                    //Adicionando JSON em um array
                    this.arrayAreasDoBD.push(json.data[i]);
                }
            }
        });

    }

    //Método para atualizar subareas a partir da area selecionada
    loadList(selectedValue: any) {

        //Cabeçalho da requisição
        var headers = new Headers();
        headers.append("Accept", 'application/json');
        headers.append('Content-Type', 'application/json');

        //instanciando uma variável do tipo RequestOption e passando como parâmetro a variavel headers
        let options = new RequestOptions({ headers: headers });

        console.log(this.areaSelecionada);
        //Parâmetros que são passados do formulário para serem validados no banco de dados através de uma requisição
        let postParams = {
            area: selectedValue
        }
        //Request para carregar as subareas do banco de dados
        this.http.post("http://www.localhost:8000/api/postcarregasubareas", postParams, options).map((res: Response) => (res.json())).subscribe(data => {

            if (data.status == "success") {
                this.arraySubAreasJSON = [];
                for (var i = 0; i < data.data.length; i++) {
                    //Adicionando JSON a um array
                    this.arraySubAreasJSON.push(data.data[i]);

                }
            }

        });

    }



    EnviarInformacoes() {

        //Cabeçalho da requisição
        var headers = new Headers();
        headers.append("Accept", 'application/json');
        headers.append('Content-Type', 'application/json');

        var controle = true;
        var dataAtual = new Date();
        var dataRecebida = new Date(this.dataReg);
        //Validando a data passada
        if (dataRecebida > dataAtual) {
            controle = false;
            this.doAlertValidaData();
            //Validando se foi escolhido um lugar no mapa
        } else if (HomePage.longSelecionada == '' || HomePage.latSelecionada == '') {
            controle = false;
            this.doAlertCoordenadas();
        }
        else {
            controle = true;
        }

        if (controle) {
            //Parâmetros que são passados do formulário para serem salvos no banco de dados através de uma requisição
            let postParams = {

                dataReg: this.dataReg,
                descricao: this.descricao,
                longitude: HomePage.longSelecionada,
                latitude: HomePage.latSelecionada,
                idCidadao: this.idCidadao,
                subarea: this.subAreaSelecionada
            }

            //REQUEST PARA SALVAR DADOS NO BANCO
            this.http.post("http://www.localhost:8000/api/postregistros", postParams).subscribe((res: Response) => {

            });

            //Método para limpar os dados do formulário
            this.Limpar();

            HomePage.latSelecionada = '';
            HomePage.longSelecionada = '';
            //Método executado quando o registro é realizado com sucesso
            this.doAlertRegistroEfetuado();
            //Dá refresh na página
            this.navCtrl.push(HomePage, { 'id': this.idCidadao, 'name': this.nomeCidadao });
        }


    }

    //Método que inicializa o mapa
    ionViewDidLoad() {
        this.initMap();
    }

    //Método que carrega todas as propriedades para a construção do mapa
    initMap() {
        var attr = 'Projeto Final - TCC - Lucas, Rafael e Vitor'

        if (HomePage.mapaPrin != null) {
            HomePage.mapaPrin.off();
            HomePage.mapaPrin.remove();
            HomePage.mapaPrin = null;
            var node = document.getElementById("mapa");
            node.parentNode.removeChild(node);
            var div = document.createElement("div");
            div.setAttribute("id", "mapa");
            // as an example add it to the body
            document.body.appendChild(div);
        }

        //carrega a camada continentes
        var continentes = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
            id: 'continentes',
            layers: 'rioosm:continentes',
            format: 'image/png',
            transparent: true,
            version: '1.1.0',
            attribution: attr
        });

        //carrega a camada oceanos
        var oceanos = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
            id: 'oceanos',
            layers: 'rioosm:oceanos',
            format: 'image/png',
            transparent: true,
            version: '1.1.0',
            attribution: attr
        });

        HomePage.mapaPrin = new L.map('mapa', {
            //center: [-22.78, -43.29], //posição que o mapa inicializa
            center: [-22.30, -42.00], //posição que o mapa inicializa
            zoomDelta: 0.5, //define a escala de zoom dos botões zoom in e zoom out
            zoomSnap: 0.5, //define o valor fracionado de zoom do mapa
            wheelPxPerZoomLevel: 90, //define a velocidade de zoom pelo mouse
            minZoom: 7, //o mínimo de zoom, ou seja, o quão afastado pode ser do mapa
            maxZoom: 17, //o máximo de zoom, ou seja, o quão próximo pode ser do mapa
            zoom: 8, //nível inicial de zoom no mapa
            layers: [continentes, oceanos] //camadas que serão carregadas como default
        });



        HomePage.marcador = L.marker([], {
            draggable: true
        });

        HomePage.mapaPrin.on('click', posicaoProblema);
        HomePage.marcador.on('moveend', posicaoProblema);


        var posicao, lat, lon;
        //Função para colocar um marcador no mapa para efetuar o registro do problema
        function posicaoProblema(e) {
            //Verifica se o formulário está ativo para que seja colocado o marcador
            if (HomePage.formAtivo) {
                if (!HomePage.mapaPrin.hasLayer(HomePage.marcador)) {
                    posicao = e.latlng;
                    HomePage.marcador.setLatLng(posicao).addTo(HomePage.mapaPrin);
                } else {
                    posicao = HomePage.marcador.getLatLng();
                }

                //Formatando as coordenadas
                posicao = posicao.toString().split(' ', 2);
                lat = posicao[0].replace(/[LatLng(]|[,]/g, "");
                lon = posicao[1].replace(/[)]/, "");

                //variável que recebe a latitude formatada
                HomePage.latSelecionada = lat;
                //variável que recebe a longitude formatada
                HomePage.longSelecionada = lon;
                //Atribui uma popup ao marcador
                HomePage.marcador
                    .bindPopup(
                    "Seu problema será registrado aqui! Se precisar corrigir, você pode me arrastar até o ponto correto!")
                    .openPopup();
            }
        }
         //Define o zoom do mapa proximo ao chão quando a localização é carregada
         HomePage.mapaPrin.locate({ setView: true, maxZoom: 15 });
 
         //controle da escala no mapa
         L.control.scale().addTo(HomePage.mapaPrin);
 
         //declaração de variáveis
         var florestas,
             fronteiras,
             massa_agua,
             cidades,
             ilhas,
             vilas,
             estradas_ferro,
             acessos_autoestradas,
             autoestradas,
             estradas_primarias,
             estradas_secundarias,
             estradas_terciarias,
             pistas_aeroportos,
             estradas_ligacao_primarias,
             estradas_ligacao_secundarias,
             estradas_ligacao_terciarias,
             estradas_tronco,
             estradas_ligacao_tronco,
             estradas_servicos,
             estradas_nao_classificadas,
             estradas_planejadas,
             estradas_agricolas_florestais,
             outras_estradas,
             ruas_para_pedestres,
             ruas_residenciais,
             ruas_residenciais_pref_pedestres,
             estradas_contrucao,
             estradas_nao_definidas;
 
         //função para adicionar as camadas ao mapa
         function addCamadasMapa(camadas) {
             for (let i = 0; i < camadas.length; i++) {
                 HomePage.mapaPrin.addLayer(camadas[i]);
             }
         };
 
         //função que será executada ouvindo o zoom no mapa e que irá realizar as chamadas das camadas conforme o zoom, adicionar ou retira-las do controlador de camadas
         HomePage.mapaPrin.on("zoom", function () {
             if (HomePage.mapaPrin.getZoom() >= 8.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(florestas) && !HomePage.mapaPrin.hasLayer(fronteiras) && !HomePage.mapaPrin.hasLayer(massa_agua)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada florestas
                     florestas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'florestas',
                         layers: 'rioosm:florestas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada fronteiras
                     fronteiras = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'fronteiras',
                         layers: 'rioosm:fronteiras',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada massa_agua
                     massa_agua = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'massa_agua',
                         layers: 'rioosm:massa_agua',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([florestas, fronteiras, massa_agua]);
                 }
             }
 
             if (HomePage.mapaPrin.getZoom() >= 9.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(cidades) && !HomePage.mapaPrin.hasLayer(ilhas) && !HomePage.mapaPrin.hasLayer(vilas)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada cidades
                     cidades = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'cidades',
                         layers: 'rioosm:cidades',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada ilhas
                     ilhas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'ilhas',
                         layers: 'rioosm:ilhas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada vilas
                     vilas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'vilas',
                         layers: 'rioosm:vilas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([cidades, ilhas, vilas]);
                 }
             }
 
             if (HomePage.mapaPrin.getZoom() >= 10.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(estradas_ferro) && !HomePage.mapaPrin.hasLayer(acessos_autoestradas) && !HomePage.mapaPrin.hasLayer(autoestradas) && !HomePage.mapaPrin.hasLayer(estradas_primarias) && !HomePage.mapaPrin.hasLayer(estradas_secundarias) && !HomePage.mapaPrin.hasLayer(estradas_terciarias) && !HomePage.mapaPrin.hasLayer(pistas_aeroportos)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada estradas_ferro
                     estradas_ferro = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_ferro',
                         layers: 'rioosm:estradas_ferro',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada acessos_autoestradas
                     acessos_autoestradas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'acessos_autoestradas',
                         layers: 'rioosm:acessos_autoestradas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada autoestradas
                     autoestradas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'autoestradas',
                         layers: 'rioosm:autoestradas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_primarias
                     estradas_primarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_primarias',
                         layers: 'rioosm:estradas_primarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_secundarias
                     estradas_secundarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_secundarias',
                         layers: 'rioosm:estradas_secundarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_terciarias
                     estradas_terciarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_terciarias',
                         layers: 'rioosm:estradas_terciarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada pistas_aeroportos
                     pistas_aeroportos = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'pistas_aeroportos',
                         layers: 'rioosm:pistas_aeroportos',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([estradas_ferro, acessos_autoestradas, autoestradas, estradas_primarias, estradas_secundarias, estradas_terciarias, pistas_aeroportos]);
                 }
             }
 
             if (HomePage.mapaPrin.getZoom() >= 11.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(estradas_ligacao_primarias) && !HomePage.mapaPrin.hasLayer(estradas_ligacao_secundarias) && !HomePage.mapaPrin.hasLayer(estradas_ligacao_terciarias)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada estradas_ligacao_primarias
                     estradas_ligacao_primarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_ligacao_primarias',
                         layers: 'rioosm:estradas_ligacao_primarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_ligacao_secundarias
                     estradas_ligacao_secundarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_ligacao_secundarias',
                         layers: 'rioosm:estradas_ligacao_secundarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_ligacao_terciarias
                     estradas_ligacao_terciarias = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_ligacao_terciarias',
                         layers: 'rioosm:estradas_ligacao_terciarias',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([estradas_ligacao_primarias, estradas_ligacao_secundarias, estradas_ligacao_terciarias]);
                 }
             }
 
             if (HomePage.mapaPrin.getZoom() >= 12.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(estradas_tronco) && !HomePage.mapaPrin.hasLayer(estradas_ligacao_tronco) && !HomePage.mapaPrin.hasLayer(estradas_servicos) && !HomePage.mapaPrin.hasLayer(estradas_nao_classificadas) && !HomePage.mapaPrin.hasLayer(estradas_planejadas) && !HomePage.mapaPrin.hasLayer(estradas_agricolas_florestais) && !HomePage.mapaPrin.hasLayer(outras_estradas)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada estradas_tronco
                     estradas_tronco = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_tronco',
                         layers: 'rioosm:estradas_tronco',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_ligacao_tronco
                     estradas_ligacao_tronco = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_ligacao_tronco',
                         layers: 'rioosm:estradas_ligacao_tronco',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_servicos
                     estradas_servicos = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_servicos',
                         layers: 'rioosm:estradas_servicos',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_nao_classificadas
                     estradas_nao_classificadas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_nao_classificadas',
                         layers: 'rioosm:estradas_nao_classificadas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_planejadas
                     estradas_planejadas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_planejadas',
                         layers: 'rioosm:estradas_planejadas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_agricolas_florestais
                     estradas_agricolas_florestais = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_agricolas_florestais',
                         layers: 'rioosm:estradas_agricolas_florestais',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada outras_estradas
                     outras_estradas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'outras_estradas',
                         layers: 'rioosm:outras_estradas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([estradas_tronco, estradas_ligacao_tronco, estradas_servicos, estradas_nao_classificadas, estradas_planejadas, estradas_agricolas_florestais, outras_estradas]);
                 }
             }
 
             if (HomePage.mapaPrin.getZoom() >= 14.5) {
                 //primeira chamada, quando as camadas ainda não estão no mapa
                 if (!HomePage.mapaPrin.hasLayer(ruas_para_pedestres) && !HomePage.mapaPrin.hasLayer(ruas_residenciais) && !HomePage.mapaPrin.hasLayer(ruas_residenciais_pref_pedestres) && !HomePage.mapaPrin.hasLayer(estradas_contrucao) && !HomePage.mapaPrin.hasLayer(estradas_nao_definidas)) {
                     //chamadas as camadas do geoserver a serem armazenadas nas variáveis correspondentes
                     //carrega a camada ruas_para_pedestres
                     ruas_para_pedestres = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'ruas_para_pedestres',
                         layers: 'rioosm:ruas_para_pedestres',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada ruas_residenciais
                     ruas_residenciais = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'ruas_residenciais',
                         layers: 'rioosm:ruas_residenciais',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada ruas_residenciais_pref_pedestres
                     ruas_residenciais_pref_pedestres = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'ruas_residenciais_pref_pedestres',
                         layers: 'rioosm:ruas_residenciais_pref_pedestres',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_contrucao
                     estradas_contrucao = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_contrucao',
                         layers: 'rioosm:estradas_contrucao',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //carrega a camada estradas_nao_definidas
                     estradas_nao_definidas = L.tileLayer.wms('http://localhost:8080/geoserver/rioosm/wms', {
                         id: 'estradas_nao_definidas',
                         layers: 'rioosm:estradas_nao_definidas',
                         format: 'image/png',
                         transparent: true,
                         version: '1.1.0',
                         attribution: attr,
                         crs: L.CRS.EPSG4326
                     });
 
                     //adicionando as camadas ao mapa
                     addCamadasMapa([ruas_para_pedestres, ruas_residenciais, ruas_residenciais_pref_pedestres, estradas_contrucao, estradas_nao_definidas]);
                 }
             }
             //coloca estas camadas na frente de todas as outras
             if (HomePage.mapaPrin.hasLayer(acessos_autoestradas))
                 acessos_autoestradas.bringToFront();
             if (HomePage.mapaPrin.hasLayer(autoestradas))
                 autoestradas.bringToFront();
             if (HomePage.mapaPrin.hasLayer(cidades))
                 cidades.bringToFront();
             if (HomePage.mapaPrin.hasLayer(ilhas))
                 ilhas.bringToFront();
             if (HomePage.mapaPrin.hasLayer(vilas))
                 vilas.bringToFront();
             if (HomePage.mapaPrin.hasLayer(fronteiras))
                 fronteiras.bringToFront();
             if (HomePage.mapaPrin.hasLayer(HomePage.problemas))
                 HomePage.problemas.bringToFront();
         });

        /*HomePage.mapaPrin = L.map('mapa').setView([-3.130409, -60.023426], 12);
        L
            .tileLayer(
            'http://a.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png',
            {
                attribution: 'Mapas &copy; OpenCycleMap, Dados do Mapa &copy;contribuidores do OpenStreetMap'
            }).addTo(HomePage.mapaPrin);

        //Habilita a geolocalizacao do usuario (necessário o usuário confirmar no
        //navegador)
        HomePage.mapaPrin.locate({
            setView: true
        });

        //O mapa irá iniciar na localização do usuário e no zoom de nível 15 (se
        //habilitada pelo mesmo, caso contrário, iniciará na posição definida na
        //criação da variável mapa)
        function localizacaoUsuario(e) {
            HomePage.mapaPrin.flyTo(e.latlng, 15);
        }

        //Ao iniciar o carregamento do mapa, dispara a localização do usuário
        HomePage.mapaPrin.on('locationfound', localizacaoUsuario);*/
    }

    //Método para efetuar logout
    deslogar() {
        this.storage.clear();
        this.navCtrl.push(InicioPage);
    }

    //Método para limpar os dados do formulário
    Limpar() {
        this.areaSelecionada = null;
        this.subAreaSelecionada = null;
        this.dataReg = null;
        this.descricao = null;
    }

    //Método para mostrar os problemas no mapa
    MostrarProblema() {

        if (!HomePage.mapaPrin.hasLayer(HomePage.problemas)) {
            this.estadoComponente('mostrarProblemas');
            //Cabeçalho da requisição
            var headers = new Headers();
            headers.append("Accept", 'application/json');
            headers.append('Content-Type', 'application/json');

            let options = new RequestOptions({ headers: headers });

            //Parâmetro passado para consultar no banco de dados somente os problemas do usuário que está logado
            let postParams = {
                id_cidadao: this.idCidadao
            }

            //Request para consultar os problemas registrados pelo usuário
            this.http.post("http://www.localhost:8000/api/postvisaoregistros", postParams, options).map((res: Response) =>
                (res.json())).subscribe(data => {

                    var geojson = {};
                    geojson['type'] = 'FeatureCollection';
                    geojson['features'] = [];
                    var coord, lat, long;

                    if (data.data) {
                        //Criação de um GeoJSON com as informações carregadas da consulta
                        for (var k = 0; k < data.data.length; k++) {
                            coord = data.data[k].local.toString().split(' ', 2);
                            lat = coord[0].replace(/[POINT(]|/g, "");
                            long = coord[1].replace(/[)]/, "");
                            var newFeature = {
                                "type": "Feature",
                                "geometry": {
                                    "type": "Point",
                                    "coordinates": [parseFloat(long),
                                    parseFloat(lat)]
                                },
                                "properties": {
                                    "id": data.data[k].id,
                                    "subarea": data.data[k].nome_subarea,
                                    "data": data.data[k].data,
                                    "descricao": data.data[k].descricao,
                                    "resposta": data.data[k].resposta,
                                    "cidadao": data.data[k].cidadao_id
                                }
                            }
                            geojson['features'].push(newFeature);
                        }
                    } else {
                        
                        this.doAlertProblemas();                       
                    }

                    //Função que coloca os maracdores no mapa com uma popup trazendo o problema relacionado a esse marcador
                    function paraCadaFeature(feature, layer) {

                        var resp = feature.properties.resposta;
                        if (resp == null) {
                            resp = "Não existe resposta ainda";
                        }
                        layer.bindPopup("<span id='subAreaTeste'><b>Detalhes do problema<br></b><i> Subarea:</i> " + feature.properties.subarea +
                            '</span>' + "<span id='dataTeste'> <br><i>Data:</i> " + feature.properties.data +
                            '</span><br>' + "<span id='descTeste'> <br><i>Descricao:</i> " + feature.properties.descricao + '</span><br>' +
                            "<span id='respTeste'> <br><i>Resposta:</i> " + resp + '</span>');

                    }

                    HomePage.problemas = new L.GeoJSON(geojson, {
                        onEachFeature: paraCadaFeature
                    });

                    HomePage.problemas.addTo(HomePage.mapaPrin);

                });

        }

        else {
            this.estadoComponente('esconderProblemas');
        }

    }

    //Método para mostrar o formulário de registro do problema
    Registrar() {
        this.registro = !this.registro;
        if (this.registro) {
            this.estadoComponente('Registrar');
        } else {
            this.estadoComponente('Desistir');
        }
    }

    //Método que dispara uma mensagem se não houver problemas registrados
    doAlertProblemas() {
        let alert = this.alertCtrl.create({
            title: 'Não há problemas registrados!',
            subTitle: 'Registre um problema!',
            buttons: ['Entendi!']
        });

        alert.present();
    }
    //Método que dispara uma mensagem se não for escolhido um lugar no mapa para realizar um registro
    doAlertCoordenadas() {
        let alert = this.alertCtrl.create({
            title: 'Lugar não selecionado!',
            subTitle: 'Clique no mapa!',
            buttons: ['Entendi!']
        });

        alert.present();

    }
    //Método que dispara uma mensagem de formulário efetuado com sucesso
    doAlertRegistroEfetuado() {
        let alert = this.alertCtrl.create({
            title: 'Registro efetuado com sucesso!',
            buttons: ['OK!']
        });

        alert.present();

    }
    //Método que altera o estado dos componentes
    estadoComponente(estado) {
        //Mostra os problemas no mapa e se houver algum marcador no mapa, remove o mesmo, depois altera 
        //o estado do botão e deixa o formulário desabilitado caso o mesmo se encontre ativado.
        if (estado == 'mostrarProblemas') {
            if (HomePage.mapaPrin.hasLayer(HomePage.marcador)) {
                HomePage.mapaPrin.removeLayer(HomePage.marcador);
            }
            if (HomePage.mapaPrin.hasLayer(HomePage.problemas)) {
                HomePage.mapaPrin.removeLayer(HomePage.problemas);
            }
            this.labelProblemas = 'Esconder Problemas';
            this.labelFormulario = 'Registrar';
            this.registro = false;
            //Altera o estado do botão, e remove os probemas do mapa, mantendo o formulário desabilitado  
        } else if (estado == 'esconderProblemas') {
            if (HomePage.mapaPrin.hasLayer(HomePage.marcador)) {
                HomePage.mapaPrin.removeLayer(HomePage.marcador);
            }
            if (HomePage.mapaPrin.hasLayer(HomePage.problemas)) {
                HomePage.mapaPrin.removeLayer(HomePage.problemas);
            }
            this.labelProblemas = 'Ver problemas';
            this.labelFormulario = 'Registrar';
            this.registro = false;
            //Habilita o formulário na tela e permite que um marcador seja colocado no mapa
            //Também remove os problemas do mapa caso estes estão habilitados  
        } else if (estado == 'Registrar') {
            if (HomePage.mapaPrin.hasLayer(HomePage.marcador)) {
                HomePage.mapaPrin.removeLayer(HomePage.marcador);
            }

            if (HomePage.mapaPrin.hasLayer(HomePage.problemas)) {
                HomePage.mapaPrin.removeLayer(HomePage.problemas);
            }

            this.labelProblemas = 'Ver problemas';
            this.labelFormulario = 'Desistir';
            HomePage.formAtivo = true;
            //Remove o formulário da tela e o marcador, caso o mesmo tenho sido colocado no mapa  
        } else if (estado == 'Desistir') {
            if (HomePage.mapaPrin.hasLayer(HomePage.marcador)) {
                HomePage.mapaPrin.removeLayer(HomePage.marcador);
            }
            if (HomePage.mapaPrin.hasLayer(HomePage.problemas)) {
                HomePage.mapaPrin.removeLayer(HomePage.problemas);
            }
            this.labelProblemas = 'Ver problemas';
            this.labelFormulario = 'Registrar';
            HomePage.formAtivo = false;
        }
    }

    doAlertValidaData() {
        let alert = this.alertCtrl.create({
            title: 'Data Inválida!',
            subTitle: 'Data superior a atual!',
            buttons: ['Entendi!']
        });

        alert.present();

    }

}
