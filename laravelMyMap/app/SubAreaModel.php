<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class SubAreaModel extends Model
{
    protected $fillable = [
        'id', 'nome', 'area_id'
    ];
}