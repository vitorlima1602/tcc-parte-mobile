<?php

namespace App\Http\Controllers;


use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
//use App\Http\Requests\Request;
use Illuminate\Http\Request;
use App\AreaModel;
use App\SubAreaModel;
use App\RegistroModel;
use App\CadastroModel;
use App\AreaSubareaModel;
use DB;

$usuario;

class ApiMyMapController extends Controller
{


public function getAreas() {

	try {

    $QueryAreas = "select id,nome from areas";
    $QueryCountAreas = "select count(*) from areas";
    $count = DB::select($QueryCountAreas);
    $areas = DB::select($QueryAreas);

    
		 if ($count > 0) {
    	return response(["status" => "success", "count" => $count, "data" => $areas, "status_code" => 200], 200);
     } else {
     	return response(["status" => "error", "message" => "no records found", "status_code" => 200], 200);
   	 }

   } catch (Exception $ex) {
    		return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);   		
   }

}


public function postCarregaSubareas(Request $request){
   try {
    
        $QuerySubAreas = "select distinct sub.id,sub.nome from areas as ar, subareas as sub
        where sub.area_id = ". $request->area .";";
        $subareas = DB::select($QuerySubAreas);


    if ($subareas != null) {
      return response(["status" => "success", "data" => $subareas, "status_code" => 200], 200);
     } else {
      return response(["status" => "error", "message" => "no records found", "status_code" => 200], 200);
     }
    }catch (Exception $ex) {
        return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
   }

}

public function postVisaoRegistros(Request $request){

      try {
    
        $QueryRegistros = "select ST_AsText(local) as local, pr.id, sub.nome as nome_subarea, 
    pr.data, pr.descricao, pr.resposta, pr.cidadao_id from problemas as pr, subareas as sub
    where pr.cidadao_id ='". $request->id_cidadao ."'And pr.subarea_id = sub.id ";
    $registros = DB::select($QueryRegistros);


    if ($registros != null) {
      return response(["status" => "success", "data" => $registros, "status_code" => 200], 200);
     } else {
      return response(["status" => "error", "message" => "no records found", "status_code" => 200], 200);
     }
    }catch (Exception $ex) {
        return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
   }

}

public function postValidaUsuario(Request $request){
 try {

  $QueryValidaUsuario = "select * from cidadaos
        where nomeusuario = '". $request->nomeusuario ."';";
  $usuario = DB::select($QueryValidaUsuario);


    if ($usuario != null) {
      return response(["status" => "success", "data" => $usuario[0], "status_code" => 200], 200);
     } else {
      return response(["status" => "error", "message" => "no records found", "status_code" => 200], 200);
     }
    }catch (Exception $ex) {
        return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
   }
}


public function postEfetuarLogin(Request $request){

  
  try {
    
    $QueryLogin = "select * from cidadaos WHERE nomeusuario= '" . $request->login . "' AND senha= '".$request->senha."'";
    $usuario = DB::select($QueryLogin);

    
    if($usuario){
     return response(["status" => "success", "data" => $usuario[0], "status_code" => 200], 200);    
    }else{
      return response(["status" => "error", "status_code" => 200], 200);  

    }

  
  }catch (Exception $ex) {
  
    return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
  
  }

}


public function postRegistros(Request $request){


  try {
  $IdUltProblema = DB::table('problemas')->max('id');
  $IdUltProblema++;

 
  $local = "ST_GeomFromText('POINT(". $request->latitude . " " . $request->longitude . ")', 4326)";
  $QueryProblema = "insert INTO problemas(id,data,descricao,local,cidadao_id,subarea_id) VALUES (". $IdUltProblema .",'" . $request->dataReg . "','" . $request->descricao . "'," .$local . "," . $request->idCidadao . "," . $request->subarea . ")";

  $problema = DB::select($QueryProblema);   

  
  }catch (Exception $ex) {
  
    return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
  
  }

}

public function postCadastros(Request $request){

  try {

    $IdUltCidadao = DB::table('cidadaos')->max('id');
    $IdUltCidadao++;
  
    DB::table('cidadaos')->insert(['id'=> $IdUltCidadao,'nomeusuario' => $request->nomeUsuario,'primeironome' => $request->primNome, 'ultimonome' => $request->ultNome,
    'senha' => $request->senha,'email' => $request->email,'logradouro' => $request->logradouro, 'numero' => $request->numero, 'bairro' => $request->bairro,
    'cidade' => $request->cidade]);
  
  }catch (Exception $ex) {
  
    return response(["status" => "error", "message" => "Internal Server Error " . $ex->getCode(), "status_code" => 500], 500);      
  
  }

}


}