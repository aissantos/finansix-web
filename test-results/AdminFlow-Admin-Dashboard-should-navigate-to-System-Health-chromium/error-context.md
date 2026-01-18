# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img "Finansix Logo" [ref=e10]
        - heading "Bem-vindo de volta" [level=1] [ref=e13]
        - paragraph [ref=e14]: Entre na sua conta Finansix
      - generic [ref=e15]:
        - generic [ref=e17]:
          - img [ref=e19]
          - textbox "Seu email" [ref=e22]
        - generic [ref=e23]:
          - generic [ref=e24]:
            - img [ref=e26]
            - textbox "Sua senha" [ref=e29]
          - button [ref=e30] [cursor=pointer]:
            - img [ref=e31]
        - link "Esqueceu a senha?" [ref=e35] [cursor=pointer]:
          - /url: /auth/forgot-password
        - button "Entrar" [ref=e36] [cursor=pointer]
      - generic [ref=e41]: ou
      - paragraph [ref=e42]:
        - text: Não tem uma conta?
        - link "Criar conta" [ref=e43] [cursor=pointer]:
          - /url: /auth/register
    - region "Notifications (F8)":
      - list
  - generic [ref=e44]:
    - img [ref=e46]
    - button "Open Tanstack query devtools" [ref=e94] [cursor=pointer]:
      - img [ref=e95]
```