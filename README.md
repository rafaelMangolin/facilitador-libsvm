# facilitador-libsvm

O facilitador é uma ferramenta feita em javascript para ser executada em NodeJS no ambiente linux, para facilitar a execução do libsvm, além de fornecer funcionalidades para a execução do programa com folds.

## Dependêcias
  - NodeJS 5.0 ou >

## Entrada

Para utilizar a ferramenta é necessario ter dois arquivos. Um contendo o identificador do audio, a classe do audio e numero da fold em que será utilizado para teste. Exemplo (arquivo conf.txt):
 ```text
 identificador_audio;classe_audio;num_fold
```
Outro contendo caracteristicas do audio separada espaço, onde o último valor de cada linha é o identificador do audio (obs: a quantidade de caracteristica vai depender do extrator utilizado). No seguinte formato (arquivo rotulos.txt):
 ```text/
0.093193 0.028115 0.008976 0.008344 ... a001_0_30.wav 
```
Digite e execute o seguinte comando no terminal:

 ```bash
$ node automatic.js conf.txt rotulos.txt
```
Assim a ferramenta irá montar as folds de acordo com o que está descrito no arquivo de configuração, e executar as runs de cada fold.
 
 ### Opções de execução
 - -s: executa os testes de cada fold, mas na hora de executar o treino, faz um com todos os audios, gerando uma modelo de treino que pode ser usado por todas as rodadas de teste;
 - -f n: caso queira executar uma quantidade n de folds, sem precisar modificar o arquivo de configuração. É criado n folds com uma quantidade balanceada de audios, e a disposioção das classes nas folds também são balanceadas.

## Saída
Toda saída do facilitador vai se encontrar na pasta folds, contendo os arquivos usados para executar as runs do libsvm de cada fold, e também o arquivo de resultado de cada fold que contém a porcentagem geral de acerto para aquela fold e a predição da classe para cada audio.
