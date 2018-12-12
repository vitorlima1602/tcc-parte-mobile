<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class VisaoRegistroModel extends Model
{
    protected $fillable = [
      'id','data','descricao','local','resposta', 'administrador_id','cidadao_id', 'subarea_id'
    ];
}
