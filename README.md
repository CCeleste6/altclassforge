# Class Forge Roguelike v4.3

Versão com hotfix do modo IA real.

## O que mudou na v4.3

- O botão **Forjar Dungeon com IA** agora tenta gerar de verdade antes de desistir.
- O modelo padrão passou para **Gemini 2.5 Flash-Lite**, que é mais leve.
- Foi adicionado seletor de modelo: Flash-Lite, Flash e Flash Latest.
- Em erros temporários do Gemini, como 429, 500, 503 e 504, o jogo tenta novamente com espera curta.
- Se o modelo escolhido falhar, o jogo tenta modelos alternativos automaticamente.
- O carregamento agora mostra qual modelo está sendo chamado.
- Se a IA falhar mesmo depois das tentativas, o jogo não finge sucesso: ele pergunta se você quer abrir a demo.
- O prompt agora pede JSON puro e usa `responseMimeType: application/json`.
- Cache atualizado para `v=4.3.0`.
- Save local atualizado para `classForgeRoguelikeSaveV43`.

## Como subir no GitHub Pages

1. Extraia o pacote.
2. Substitua os arquivos antigos do repositório por estes arquivos.
3. Mantenha a estrutura:

```txt
index.html
css/
js/
README.md
```

4. Aguarde o GitHub Pages atualizar.
5. Abra o site com Ctrl + F5 ou em aba anônima.

## Observação importante

Erro HTTP 503 vem do serviço do Gemini, não do Class Forge. Esta versão reduz bastante a chance de travar por isso porque tenta novamente e troca de modelo, mas nenhum site estático consegue garantir 100% se a API externa estiver temporariamente indisponível.

Para uso público de verdade, o ideal é mover a API Key para um backend/proxy, porque GitHub Pages roda tudo no navegador.
