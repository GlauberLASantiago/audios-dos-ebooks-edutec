# Áudios dos e-books EduTec

Player da coleção EduTec, desenvolvido pelo professor Glauber Santiago (DAC/UFSCar), com apoio do Grupo Horizonte-UFSCar.

**Abrir o aplicativo:** https://glauberlasantiago.github.io/audios-dos-ebooks-edutec/

O primeiro áudio disponível é o componente **89 — Tópicos Especiais em Educação e Tecnologias**, de Daniel Mill e Glauber Santiago, narrado com a voz sintética Thalita Multilingual Neural, da Microsoft.

## Como adicionar outros áudios

1. Coloque os arquivos na pasta **audios** deste repositório. Também são reconhecidos arquivos de áudio soltos na raiz.
2. Salve a alteração no GitHub (commit e push).
3. Aguarde a execução de **Publicar biblioteca de áudios**, na guia **Actions**. Depois atualize o aplicativo.

O catálogo é gerado automaticamente; não é preciso editar HTML, JavaScript ou uma lista de arquivos. Subpastas dentro de `audios` também são reconhecidas.

**Arquivos grandes:** o envio pelo navegador do GitHub aceita até 25 MiB por arquivo. Para áudios como o do livro 89 (cerca de 32 MB), use o [GitHub Desktop](https://desktop.github.com/): clone este repositório, copie o áudio para `audios`, faça o commit e clique em **Push origin**. O limite do Git comum é 100 MiB por arquivo. Arquivos maiores precisam de outra forma de armazenamento; Git LFS não deve ser usado para servir os áudios pelo Pages.

Formatos reconhecidos: MP3, M4A, OGG, OGA, WAV, FLAC, AAC, OPUS e WEBM. A reprodução depende do suporte do navegador ao formato e ao codec. MP3 é o formato usado nesta demonstração.

## Títulos e capítulos

O player aproveita o título, a autoria, a duração e os capítulos presentes nas tags ID3 de arquivos MP3. Sem essas informações, usa o nome do arquivo. Para facilitar a organização, prefira nomes como `14_Aprendizagem_Colaborativa_nas_Comunidades_em_Rede.mp3`.

É possível trocar de livro, pesquisar, ajustar a velocidade, voltar ou avançar 15 segundos, baixar o áudio e navegar pelos capítulos disponíveis. O ponto de escuta é salvo somente no navegador do ouvinte, sem login e sem sincronização entre dispositivos.

## Estrutura

- `audios/`: áudios da coleção, disponibilizados publicamente.
- `public/`: interface do player.
- `scripts/build.py`: gera o catálogo e prepara a publicação, sem bibliotecas externas.
- `.github/workflows/pages.yml`: publica o aplicativo após cada envio à branch `main`.

Para testar localmente: execute `python scripts/build.py` e depois `python -m http.server 8765 --directory _site`. Abra `http://localhost:8765`. O catálogo usa uma requisição local, por isso o player deve ser aberto por um servidor HTTP, e não pelo duplo clique no HTML.

## Créditos e direitos

As obras, as narrações e as marcas mantêm seus respectivos créditos e direitos. A publicação neste repositório não atribui uma licença de reutilização aos livros ou às marcas.

[Grupo Horizonte](https://grupohorizonte.ufscar.br/) · [EduTec](http://edutec.ufscar.br/) · [Glauber Santiago](https://servidores.ufscar.br/glauber/)

Limites de envio: [documentação do GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository).
