<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class RegistroModel extends Model
{
    protected $fillable = [
        'id','data','descricao', 'local','resposta', 'administrador_id', 'cidadao_id', 'subarea_id'
    ];
}
