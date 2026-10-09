---
title: "Self-hosted LLMs and a RAG over card specifications"
card: Self-hosted LLMs and a card-spec RAG
summary: I set up KONA's own LLM stack on an NVIDIA DGX Spark, put every model behind one gateway and moved our agents onto it. I also built a RAG over 54 card specifications that our card personalization engineers use every day.
outcome: Our agents run on models we host ourselves, so bank data never goes to an outside model API.
meta: KONA · LLM infrastructure · 2026
org: KONA Software Lab
years: "2026"
role: I set up the DGX Spark with vLLM and the LiteLLM gateway, ran the load tests, and moved the agent services onto the gateway. I also built the RAG over card specifications on a customised RAGFlow.
status: In use by the agent services and the card personalization team
order: 5
featured: false
group: kona
published: 2026-10-09
stack: [NVIDIA DGX Spark, vLLM, LiteLLM, Qwen, NVFP4, RAGFlow, Python]
plain: KONA's AI assistants run on a machine we own, so bank data never goes to an outside AI company. I also built a search assistant that answers card engineers' questions from the card specifications they work with every day.
links:
  - { label: "I tried running RAGFlow on an Apple M5 Mac (Medium)", href: "https://medium.com/@zakariahossain/i-tried-running-ragflow-on-an-apple-m5-mac-heres-what-actually-happened-9367c5b24dee" }
diagram:
  caption: Agent services ask one gateway for a model, and the gateway sends the request to vLLM on the DGX Spark.
  stages:
    - title: Agents
      nodes:
        - { label: Agent services, note: make the LLM calls }
        - { label: Model lookup, note: finds the chat model, mine: true }
    - title: Gateway
      nodes:
        - { label: LiteLLM gateway, note: "one address, all models", mine: true }
    - title: Serving
      nodes:
        - { label: vLLM, note: serves the models, mine: true }
    - title: Models
      nodes:
        - { label: Qwen 27B, note: "chat model, NVFP4", mine: true }
        - { label: Embedding model, note: text to vectors, mine: true }
        - { label: Reranker, note: best matches first, mine: true }
    - title: Hardware
      nodes:
        - { label: NVIDIA DGX Spark, note: our own machine, mine: true }
---

## How it works

The models run on an NVIDIA DGX Spark that I set up. vLLM serves a 27B Qwen model in NVFP4, a 4-bit number format, alongside an embedding model and a reranker. An embedding model turns text into lists of numbers, so passages with a similar meaning can be found. A reranker then puts the best of those matches first. All three sit behind a LiteLLM gateway, so every service has one address and one API for every model.

I moved the agent services onto the gateway. They no longer carry a fixed model name. Instead they ask the gateway what it serves and pick the chat model themselves. That took one more step than it sounds. The gateway's plain model list returns bare names, and a bare name can't tell a chat model from an embedding model or a reranker. So the lookup asks the gateway's model-info endpoint first, which reports what each model is for. Against a bare vLLM server with no gateway in front, it falls back to the plain list. A name pinned by hand still works. It is checked against everything the server serves, not only the chat models, because a pin is a deliberate choice and a narrower check would reject names the server really does serve. I covered the lookup with tests. The agent services behind the [card management assistant](/work/agentic-cms-assistant/) run on this stack.

The RAG is a separate system. I built it on a customised RAGFlow over 54 card specifications: 17 from EMV, 4 from GlobalPlatform, 9 for Mastercard M/Chip and 24 from Visa, plus Visa profile XMLs and TakaPay material. EMV is the common standard for chip cards, GlobalPlatform covers how applications are managed on the chip, and the Mastercard and Visa documents describe each network's own chip applications. Card personalization is the step where a chip card gets its applications and data, and the rules for it are spread across documents like these. Our card personalization engineers use the RAG as their daily reference. They ask a question in plain words and get an answer drawn from the specifications.

I also wrote about [running RAGFlow on an Apple M5 Mac](https://medium.com/@zakariahossain/i-tried-running-ragflow-on-an-apple-m5-mac-heres-what-actually-happened-9367c5b24dee).

## Key decisions

### Host the models ourselves

The agents work with live bank data: products, cards and transactions. I kept the models on our own hardware, so bank data never goes to an outside model API.

### One gateway in front of every model

Services reach the models only through the gateway, never through vLLM directly. That way a model can be swapped, renamed or added at the gateway without redeploying a single agent. It matters because the served model does change. A service with a stale model name pinned in its config fails every request until someone edits that config. With the lookup, a service finds the current chat model on its own.

The same gateway also serves the embedding model and the reranker. That is exactly why the lookup was needed: once one address serves three kinds of model, a service has to ask which one is for chat.

### Index the real specifications

The engineers' questions are about exact rules in EMV, GlobalPlatform, Mastercard M/Chip and Visa documents. So the RAG answers from the documents themselves, not from what a model happens to remember. I indexed the specifications the team actually works from, so an answer comes from the same text an engineer would otherwise look up by hand.

## Results

I ran the load tests on the DGX Spark myself. A token is roughly a word or part of a word.

- **Throughput:** about 205 tokens a second across 16 parallel streams, that is, 16 answers being written at the same time.
- **Reliability:** at a steady 1.5 requests a second, 453 of 453 requests succeeded.
- **Prefill:** reading the prompt before answering peaked at about 2,410 tokens a second.
- **Prefix cache:** a hit rate of about 54%. When requests start with the same text, such as a shared system prompt, the server can reuse work it has already done instead of repeating it.

The agent services now run on this stack through the gateway, and the RAG over the card specifications is the card personalization engineers' daily reference.
