FROM ruby:3.3

WORKDIR /srv/jekyll

COPY Gemfile Gemfile.lock ./

RUN bundle install --jobs $(nproc) --retry 3

COPY . .

EXPOSE 4000

CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0", "--watch", "--force_polling"]
