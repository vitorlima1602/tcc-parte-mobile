<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class CadastroModel extends Model
{
    protected $fillable = [
        'id', 'bairro','cidade', 'email','logradouro','nomeusuario','numero','primeironome','senha','ultimonome'
    ];
}
