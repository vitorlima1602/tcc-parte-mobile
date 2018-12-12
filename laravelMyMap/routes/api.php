<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/getareas', 							'ApiMyMapController@getAreas')->name('get all areas');

Route::post('/postefetuarlogin', 							'ApiMyMapController@postEfetuarLogin')->name('post all login');

Route::post('/postregistros', 							'ApiMyMapController@postRegistros')->name('post all registros');

Route::post('/postcadastros', 							'ApiMyMapController@postCadastros')->name('post all cadastros');

Route::post('/postvisaoregistros', 							'ApiMyMapController@postvisaoregistros')->name('post all visaoregistros');

Route::post('/postcarregasubareas', 							'ApiMyMapController@postCarregaSubareas')->name('post all subareas');

Route::post('/postvalidausuario', 							'ApiMyMapController@postValidaUsuario')->name('post all usuarios');

Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();



});
