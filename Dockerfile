FROM python:3.11

RUN apt-get update && apt-get install -y \
        cmake \
        curl \
        g++ \
        gcc \
        git \
        gnupg2 \
        net-tools \
        sysstat \
        htop \
    && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home chaca
USER chaca
RUN mkdir -p /home/chaca/cha-ca-hai-chi-em
WORKDIR /home/chaca/cha-ca-hai-chi-em

COPY --chown=chaca:chaca requirements.txt /home/chaca/cha-ca-hai-chi-em/requirements.txt
ENV PATH="/home/chaca/.local/bin:${PATH}"
RUN pip install --upgrade --no-cache-dir pip \
    && pip install --no-cache-dir -r /home/chaca/cha-ca-hai-chi-em/requirements.txt

COPY --chown=chaca:chaca src /home/chaca/cha-ca-hai-chi-em/src
