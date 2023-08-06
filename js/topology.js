class Graph {
  constructor() {
    this.nodes = [];
    this.links = [];
    /**
     * @type {D3Simulation}
     */
    this.simulation;
    this.reset();
  }

  /**
   * get the links of the graph: followed --> follower
   */
  // get links() {
  //   let links = [];
  //   this.nodes.forEach(function (n) {
  //     n.following.forEach(function (m) {
  //       links.push({ source: m.name, target: n.name });
  //     });
  //   });
  //   return links;
  // }

  get avg_deviation() {
    if (this.nodes.length === 0) return 0;
    return (
      this.nodes.reduce((sum, n) => {
        return sum + n.avg_deviation_l2;
      }, 0) / this.nodes.length
    );
  }

  /**
   * simulation implements hooks:
   * - reset(nodes, links): load nodes and links
   * - update_network(
   *  t_node
   *  t_link
   *  action: 'ADD_LINK'|'DEL_LINK'|undefined
   * ): update the graph, add/del links
   * - update_strength(avg_deviation): update the strength of the repulsive force
   */
  use(simulation) {
    this.simulation = simulation;
    this.simulation.reset(this.nodes, this.links);
  }

  /**
   * reset the graph
   * @param {number} n number of nodes
   */
  reset() {
    this.nodes = d3.range(n).map((i) => {
      return new Node(i, genRandomValue(range_min, range_max));
    });
    this.links = [];
    this.nodes.forEach((n, i) => {
      this.nodes
        .filter((m, j) => {
          return i != j && Math.random() < 0.05;
        })
        .forEach((m) => {
          n.follow(m);
          let add_link = new Link(m.name, n.name);
          this.links.push(add_link);
          // this.createLink(n, m);
        });
    });

    if (this.simulation) {
      this.simulation.reset(this.nodes, this.links);
      this.simulation.update_strength(this.avg_deviation);
    }
  }

  findLink(follower, followed) {
    return this.links.find((l) => {
      return l.source.name == followed.name && l.target.name == follower.name;
    });
  }

  createLink(follower, followed) {
    let add_link = new Link(followed.name, follower.name);
    this.links.push(add_link);
    // if (this.simulation) {
    //   this.simulation.update_network(follower, add_link, "ADD_LINK");
    // }
    return add_link;
  }

  // deleteLink(follower, followed) {
  //   let del_link = this.findLink(follower, followed);
  //   if (del_link) {
  //     if (this.simulation) {
  //       this.simulation.update_network(follower, del_link, "DEL_LINK");
  //     }
  //     this.links.splice(this.links.indexOf(del_link), 1);
  //     return del_link;
  //   }
  // }

  removeLink(link) {
    this.links.splice(this.links.indexOf(link), 1);
  }

  /**
   * run the simulation for 1 step
   */
  runStep() {
    // randomly pick a node to interact
    let t_node = this.nodes[getRandomInt(0, this.nodes.length - 1)];
    t_node.readPosts();
    t_node.sendPost();
    // randomly randomly follow a new node within tolerance, and unfollow a discordant node
    if (Math.random() < rewire) {
      let actions = [];
      let new_followed;
      let unfollow_node;
      let other_nodes = this.nodes.filter((n) => {
        return (
          Math.abs(n.opinion - t_node.opinion) <= tolerance &&
          !t_node.isFollowing(n)
        );
      });

      if (other_nodes.length > 0) {
        new_followed = other_nodes[getRandomInt(0, other_nodes.length - 1)];
        t_node.follow(new_followed);
        let add_link = this.createLink(t_node, new_followed);
        actions.push([add_link, "ADD_LINK"]);
      }

      unfollow_node = t_node.unfollowRandom();
      let del_link;
      if (unfollow_node) {
        // this.deleteLink(t_node, unfollow_node);
        del_link = this.findLink(t_node, unfollow_node);
        if (del_link) {
          actions.push([del_link, "DEL_LINK"]);
        }
      }

      if (this.simulation) {
        this.simulation.update_network(t_node, actions);
      }

      if (del_link) {
        this.removeLink(del_link);
      }

      demoChat.log(
        transJS("Unfollow", {
          "t_node.name": t_node.name,
          "del_node.name": unfollow_node ? unfollow_node.name : "",
          "add_node.name": new_followed.name,
        }) + "<br/>"
      );
      this.simulation.update_strength(this.avg_deviation);
    } else {
      if (this.simulation) {
        this.simulation.update_network(t_node);
        this.simulation.update_strength(this.avg_deviation);
      }
    }
  }
}

class Node {
  constructor(name, opinion) {
    this.name = name;
    this.opinion = opinion;
    this.msg_opinion = this.opinion;
    this.followers = [];
    this.following = [];
    this.post = 0.4;

    // nodes that have the same/different opinion in the last run
    this._concordant_nodes = [];
    this._discordant_nodes = [];
  }

  /**
   * influence: number of followers
   */
  get k() {
    return this.followers.length;
  }

  /**
   * average opinion difference between the node and the nodes it follows
   */
  get avg_deviation() {
    if (this.following.length === 0) return 0;
    return (
      this.following.reduce((sum, n) => {
        return sum + Math.abs(n.opinion - this.opinion);
      }, 0) / this.following.length
    );
  }

  get avg_deviation_l2() {
    if (this.following.length === 0) return 0;
    return Math.sqrt(
      this.following.reduce((sum, n) => {
        return sum + Math.pow(n.opinion - this.opinion, 2);
      }, 0) / this.following.length
    );
  }

  isFollowing(node) {
    return this.following.indexOf(node) > -1;
  }

  _updateOpinion() {
    if (this._concordant_nodes.length > 0) {
      var sum = 0;
      for (let k in this._concordant_nodes) {
        sum += this._concordant_nodes[k].msg_opinion;
      }
      var opinion_f =
        (1 - learning) * this.opinion +
        (learning * sum) / this._concordant_nodes.length;
      let prev_opinion = this.opinion;
      this.opinion = opinion_f;

      let chat_msg = "";
      if (learning > 0) {
        chat_msg =
          transJS("ReadMessage", {
            "t_node.name": this.name,
            "concordant_nodes.length": this._concordant_nodes.length,
          }) + "<br/>";
        if (prev_opinion <= 0) {
          if (this.opinion < prev_opinion) {
            chat_msg +=
              transJS("BecomeMoreProgressive", { "t_node.name": this.name }) +
              "<br/>";
          } else {
            chat_msg +=
              transJS("BecomeLessProgressive", { "t_node.name": this.name }) +
              "<br/>";
          }
        }
        if (prev_opinion > 0) {
          if (this.opinion < prev_opinion) {
            chat_msg +=
              transJS("BecomeLessConservative", { "t_node.name": this.name }) +
              "<br/>";
          } else {
            chat_msg +=
              transJS("BecomeMoreConservative", { "t_node.name": this.name }) +
              "<br/>";
          }
        }
      }
      if (chat_msg) {
        demoChat.log(chat_msg);
      }
    }
  }

  /**
   * read the posts from the following nodes
   */
  readPosts() {
    this._concordant_nodes = [];
    this._discordant_nodes = [];
    for (let i in this.following) {
      if (Math.abs(this.opinion - this.following[i].msg_opinion) <= tolerance) {
        this._concordant_nodes.push(this.following[i]);
      } else {
        this._discordant_nodes.push(this.following[i]);
      }
    }
    this._updateOpinion();
  }

  /**
   * post message according to node's opinion or repost from following nodes
   * according to probability this.post
   */
  sendPost() {
    if (this._concordant_nodes.length == 0) {
      // no concordant nodes, just post a new message
      this.msg_opinion = this.opinion;
      demoChat.log(
        transJS("PostMessage", { "t_node.name": this.name }) + "<br/>"
      );
      return this;
    }
    if (Math.random() < this.post) {
      // post a msg reflecting its updated opinion;
      this.msg_opinion = this.opinion;
      demoChat.log(
        transJS("PostMessage", { "t_node.name": this.name }) + "<br/>"
      );
    } else {
      // repost a msg from following nodes
      var repost_node =
        this._concordant_nodes[
          getRandomInt(0, this._concordant_nodes.length - 1)
        ];
      this.msg_opinion = repost_node.msg_opinion;
      demoChat.log(
        transJS("RepostMessage", {
          "t_node.name": this.name,
          "repost_node.name": repost_node.name,
        }) + "<br/>"
      );
    }
  }

  /**
   * randomly unfollow a discordant node
   */
  unfollowRandom() {
    let node;
    if (this._discordant_nodes.length > 0) {
      node =
        this._discordant_nodes[
          getRandomInt(0, this._discordant_nodes.length - 1)
        ];
      return this.unfollow(node);
    }
  }

  unfollow(node) {
    let index = this.following.indexOf(node);
    if (index > -1) {
      this.following.splice(index, 1);
      node.followers.splice(node.followers.indexOf(this), 1);
      return node;
    }
  }

  follow(node) {
    if (!this.isFollowing(node) && node != this) {
      this.following.push(node);
      node.followers.push(this);
    }
  }
}

class Link {
  constructor(source, target) {
    this.source = source;
    this.target = target;
  }
}
