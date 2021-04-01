{
  "targets": [
    {
      "target_name": "asteroidstest",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp",
        "cpp/src/Asteroid.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'ASTEROIDS_TEST'
       ]
    }
  ]
}