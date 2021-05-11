{
  "targets": [
    {
      "target_name": "asteroidstest",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp",
        "cpp/src/Asteroid.cpp",
        "cpp/src/GameTypes.cpp",
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'ASTEROIDS_TEST'
       ]
    },
    {
      "target_name": "collidertest",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp",
        "cpp/src/Asteroid.cpp",
        "cpp/src/AsteroidCollider.cpp",
        "cpp/src/GameTypes.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'COLLIDER_TEST'
      ]
    },
    {
      "target_name": "chunktest",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp",
        "cpp/src/Asteroid.cpp",
        "cpp/src/AsteroidCollider.cpp",
        "cpp/src/Projectile.cpp",
        "cpp/src/GameTypes.cpp",
        "cpp/src/client/ClientPacket.cpp",
        "cpp/src/server/Chunk.cpp",
        "cpp/src/server/ServerPacket.cpp",
        "cpp/src/server/WorldSim.cpp",
        "cpp/src/server/BiomeManager.cpp",
        "cpp/src/Biome.cpp",
        "cpp/src/server/CollisionWorld.cpp",
        "cpp/src/Ship.cpp",
        "cpp/test/ChunkTest.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include",
        "cpp/test"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'CHUNK_TEST'
      ]
    },
    {
      "target_name": "biometest",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/test/BiomeTreeTest.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include",
        "cpp/test"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS'
      ]
    },
    {
      "target_name": "worldsim",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [
        "cpp/src/AsteroidGenerator.cpp",
        "cpp/src/Asteroid.cpp",
        "cpp/src/AsteroidCollider.cpp",
        "cpp/src/Projectile.cpp",
        "cpp/src/GameTypes.cpp",
        "cpp/src/client/ClientPacket.cpp",
        "cpp/src/server/BiomeManager.cpp",
        "cpp/src/Biome.cpp",
        "cpp/src/server/Chunk.cpp",
        "cpp/src/server/ServerPacket.cpp",
        "cpp/src/server/WorldSim.cpp",
        "cpp/src/server/CollisionWorld.cpp",
        "cpp/src/Ship.cpp"
      ],
      "include_dirs": [
        '<!@(node -p "require(\'node-addon-api\').include")',
        "cpp/include"
      ],
      "defines": [ 
        'NAPI_DISABLE_CPP_EXCEPTIONS',
        'WORLD_EXPORT'
      ]
    }
  ]
}